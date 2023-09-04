import { writable, get } from 'svelte/store'
import mapboxgl from 'mapbox-gl'

export const openModals = ( initial ) => {
    const isOpen = writable( initial )
    const { set, update } = isOpen
    return {
        isOpen,
        open: ( ) => set( true ),
        close: ( ) => set( false ),
        toggle: ( ) => update( ( n ) => !n ),
    }
}


export const AUTH = writable( { } )
export const USERS = writable( [ ] )
export const EVENT_TYPES = writable( [ ] )
export const DEVICES = writable( [ ] )
export const DEVICE_MAP_MARKERS = writable( [ ] )
export const DEVICES_LOADED = writable( false )
export const DEMO_DEVICES = writable( [ ] )

const local = true
export const SERVER = ( local ? "://127.0.0.1:8007" : "://des.leehayford.com" )
export const HTTP_SERVER = ( local ? `http${ SERVER }` : `https${ SERVER }` )
export const WS_SERVER = ( local ? `ws${ SERVER }` : `wss${ SERVER }` )

export const login = async( email, password ) => {

    let req = new Request( `${ HTTP_SERVER }/api/auth/login`, { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify( { email, password } ) 
    } )
    let res = await fetch( req )
    let auth = await res.json( )
    console.log(`"\nAppHeader: login -> RESPONSE -> auth\n${ JSON.stringify( auth, null, 4 ) }`)

    if ( auth.status === "success" ) { 
        console.log(`\nAppHeader: login -> SUCCESS:\n${ auth.token }\n` )
        sessionStorage.setItem( 'des_token', auth.token, { path: '/' } )
    }
    await get_user( )

    if ( get(AUTH).role == 'admin' && !get(DEVICES_LOADED) ) { await get_devices( )  }
}
export const logout = async( ) => {

    let req = new Request( `${ HTTP_SERVER }/api/auth/logout`, { 
        method: "GET",
        headers: { 'Authorization': `Bearer ${ sessionStorage.getItem( 'des_token' ) }` }, 
        credentials: "include"   
    } )
    let res = await fetch( req )
    let logout_res = await res.json( ) 
    console.log( `des_api.js -> logout( ) -> RESPONSE -> logout_res:\n${ JSON.stringify( logout_res, null, 4 ) }` )

    sessionStorage.setItem( 'des_token', 'none', { path: '/' } )
    AUTH.set( new User( ) ) 

    console.log(`"\ndes_api.js -> logout( ) -> LOGGED OUT! -> $AUTH\n${ JSON.stringify( get(AUTH) ) }`)
}
export const get_user = async( ) => {

    let token = sessionStorage.getItem( 'des_token' )

    let user_res = await fetch( `${ HTTP_SERVER }/user/me`, { 
            method: "GET",
            headers: { 'Authorization': `Bearer ${ token }`}      
        } 
    )
    let usr = await user_res.json() 

    if ( usr.status == "success" ) {

        AUTH.set( new User(
            usr.data.user.id, 
            usr.data.user.name, 
            usr.data.user.email, 
            usr.data.user.role,
            usr.data.user.provider, 
            usr.data.user.created_at, 
            usr.data.user.updated_at,
            token,
            true
        ) )
       console.log("\ndes_api.js -> get_user( ) -> AUTHENTICATION SUCCESS!\n" )
    } 
    else {

        AUTH.set( new User( ) )
        sessionStorage.setItem( 'des_token', 'none', { path: '/' } )
        console.log("\ndes_api.js -> get_user( ) -> AUTHENTICATION FAILED!\n" ) 
    }
    
    console.log("\ndes_api.js -> get_user( ) -> AUTH: \n", get( AUTH ) )
}

export const API_URL_USER_LIST =  `${ HTTP_SERVER }/user`
export const get_users = async( ) => {

    let req = new Request( API_URL_USER_LIST, { method: 'GET' } )
    let res = await fetch( req )
    let json = await res.json( )
    return json.data.users
}

export const API_URL_C001_V001_JOB_EVENT_TYPE_LIST =  `${ HTTP_SERVER }/api/001/001/job/event/list`
export const get_event_types = async( ) => {
    
    let req = new Request( API_URL_C001_V001_JOB_EVENT_TYPE_LIST, { method: 'GET' } )
    let res = await fetch( req )
    let json = await res.json( )
    return json.data.event_types
}

export const API_URL_C001_V001_DEVICE_REGISTER =  `${ HTTP_SERVER }/api/001/001/device/register`
export const API_URL_C001_V001_DEVICE_START =  `${ HTTP_SERVER }/api/001/001/device/start`
export const API_URL_C001_V001_DEVICE_END =  `${ HTTP_SERVER }/api/001/001/device/end`
export const API_URL_C001_V001_DEVICE_LIST =  `${ HTTP_SERVER }/api/001/001/device/list`
export const API_URL_C001_V001_DEVICE_USER_WS =  `${ WS_SERVER }/api/001/001/device/ws`

export const API_URL_GET_RUN_DEMO_SIM = `${ WS_SERVER }/api/001/001/demo/sim` 
export const get_devices = async( ) => {

    let token = sessionStorage.getItem( 'des_token' )

    DEVICES_LOADED.set( false )
    let req = new Request( API_URL_C001_V001_DEVICE_LIST, { 
        method: 'GET',
        headers: {
            "Authorization":  `Bearer ${ token }`, 
        },
    } )

    let res = await fetch( req )
    let json = await res.json( )

    if ( json.status == "success") { 

        let store = get( DEVICES )
        let devs = json.data.devices 
        console.log( "get_devices( ) -> response:\n", devs )
        
        devs.forEach( dev => {
            if( store.filter( s => { return s.reg.des_dev_serial == dev.reg.des_dev_serial } )[0] == undefined ) {
                let device = new Device(
                    dev.adm,
                    dev.hdr,
                    dev.cfg,
                    dev.evt,
                    dev.smp,
                    new Job(
                        [ dev.adm ],
                        [ dev.hdr ],
                        [ dev.cfg ],
                        [ dev.evt ],
                        [ dev.smp ],
                        [ ],
                        dev.reg
                     ),
                    dev.reg
                )
                DEVICES.update( d => { return [ ...d, device ] } )
                
                const el = document.createElement('div')
                el.className = 'marker'
                let mrkr = new mapboxgl.Marker( el ).setLngLat( [ device.reg.des_job_lng, device.reg.des_job_lat ] ) 
                DEVICE_MAP_MARKERS.update( m => { return [ ...m, mrkr ] } )
            }        
        } )
    } 
    get( DEVICES ).sort( ( a, b ) => b.reg.des_job_reg_time - a.reg.des_job_reg_time )
    DEVICES_LOADED.set( true )
    console.log( "des_api.js -> get_devices( ) -> DEVICES: ", get( DEVICES ) )
    console.log( "des_api.js -> get_devices( ) -> DEVICES_LOADED: ", get( DEVICES_LOADED ) )

}
export const register_device = async( serial ) => {
    let au = get( AUTH )
    let reg = new DESRegistration( )
    reg.des_dev_serial = serial
    reg.des_dev_reg_user_id = au.id
    reg.des_dev_reg_app = demo_app
    reg.des_job_lng = -114.75 + ( Math.random() * ( -110.15 - -114.75 ) )
    reg.des_job_lat = 51.85 + ( Math.random() * ( 54.35 - 51.85 ) )
    console.log("des_api.js -> register_device( ) -> REQUEST reg:\n", reg )

    let req = new Request( API_URL_C001_V001_DEVICE_REGISTER, { 
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ au.token }` 
        },
        body: JSON.stringify( reg )
    } )
    let res = await fetch( req )
    reg = await res.json( )
    console.log("des_api.js -> register_device( ) ->  RESPONSE reg:\n", reg )
    await get_devices( )
}

// export const API_URL_REGISTER_DEVICE =  `${ SERVER }/api/device/register`
// export const API_URL_GET_DEVICES = `${ HTTP_SERVER }/api/device/list`
// export const API_URL_GET_DEVICE_BY_SN = `${ HTTP_SERVER }/api/device/serial` 
export const API_URL_GET_JOBS =  `${ HTTP_SERVER }/api/job/list`
export const API_URL_GET_JOB_BY_NAME = `${ HTTP_SERVER }/api/job/name` 

/* export const load_get_device_by_serial = async( serverLoadEvent ) => {

    let reg = new DESRegistration( )
    reg.des_dev_serial = serverLoadEvent.params.slug

    let req = new Request( API_URL_GET_DEVICE_BY_SN, { 
        method: 'POST',
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "Authorization":  `Bearer ${ serverLoadEvent.cookies.get("des_token") }`, 
        },
        body:  JSON.stringify( reg )
    } )

    const { fetch } = serverLoadEvent
    let res = await fetch( req )
    let json = await res.json( )

    let resp = {
        status: json.status,
        message: json.message,
        device: { },
    } 
    if ( resp.status == "success") { 
        resp.device = json.data.device 
    }
   console.log(  JSON.stringify( res, null, 4 ))
    return { resp }
} */

export const load_get_jobs = async( serverLoadEvent ) => {

    let req = new Request( API_URL_GET_JOBS, { 
        method: 'GET',
        headers: {
            "Authorization":  `Bearer ${ serverLoadEvent.cookies.get("des_token") }`, 
        },
    } )

    const { fetch } = serverLoadEvent
    let res = await fetch( req )
    let json = await res.json( )

    let resp = {
        status: json.status,
        message: json.message,
        jobs: [],
    } 
    if ( resp.status == "success") { 
        resp.jobs = json.data.jobs 
    }
   
    return { resp }
} 

export const load_get_job_by_name = async( serverLoadEvent ) => {

    let reg = new DESRegistration( )
    reg.des_job_name = serverLoadEvent.params.slug

    let req = new Request( API_URL_GET_JOB_BY_NAME, { 
        method: 'POST',
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "Authorization":  `Bearer ${ serverLoadEvent.cookies.get("des_token") }`, 
        },
        body:  JSON.stringify( reg )
    } )

    const { fetch } = serverLoadEvent
    let res = await fetch( req )
    let json = await res.json( )

    let resp = {
        status: json.status,
        message: json.message,
        job: { },
    } 
    if ( resp.status == "success") { 
        resp.job = json.data.job 
    }
   
    return { resp }
} 



export const device_class = "001"
export const device_version= "001"
export const demo_app = `C${ device_class }V${ device_version }_demo_app v0.0.0`
export const client_app = `C${ device_class }V${ device_version }_client_app v0.0.0`

export class User {
    constructor(
        id = "",
        name = "",
        email = "",
        role = "",
        provider = "",
        // photo = "",
        created_at = 1691762552703,
        updated_at = 1691762552703,
        token = "none",
        logged_in = false
    ) {
        this.id  = id
        this.name = name
        this.email = email
        this.role = role,
        this.provider = provider
        // this.photo = photo
        this.created_at = created_at
        this.updated_at = updated_at
        this.token = token
        this.logged_in = logged_in
    }
}
/* 
HTTP DEVICE DATA STRUCTURE 

Longitude: -115.000000
Latitude: 55.000000
-114.75 > LNG < -110.15
51.85 > LAT < 54.35

*/
export class DESRegistration {
    constructor( 
        /* DESDevice */
        des_dev_id = 0,

        des_dev_reg_time = 0,
        des_dev_reg_addr = "",
        des_dev_reg_user_id = "",
        des_dev_reg_app = client_app,

        des_dev_serial = "",
        des_dev_version = device_class,
        des_dev_class = device_version,

        /* DESJob */
        des_job_id = 0,

        des_job_reg_time = 0,
        des_job_reg_addr = "",
        des_job_reg_user_id = "",
        des_job_reg_app = "",

        des_job_name = "",
        des_job_start = 0,
        des_job_end = 0,
        des_job_lng = -15.000000,
        des_job_lat = 55.000000,
        des_job_dev_id = 0
    ) {
        /* DESDevice */
        this.des_dev_id = des_dev_id

        this.des_dev_reg_time = des_dev_reg_time
        this.des_dev_reg_addr = des_dev_reg_addr
        this.des_dev_reg_user_id = des_dev_reg_user_id
        this.des_dev_reg_app = des_dev_reg_app

        this.des_dev_serial = des_dev_serial
        this.des_dev_version = des_dev_version
        this.des_dev_class = des_dev_class

        /* DESJob */
        this.des_job_id = des_job_id

        this.des_job_reg_time = des_job_reg_time
        this.des_job_reg_addr = des_job_reg_addr
        this.des_job_reg_user_id = des_job_reg_user_id
        this.des_job_reg_app = des_job_reg_app

        this.des_job_name = des_job_name
        this.des_job_start = des_job_start
        this.des_job_end = des_job_end
        this.des_job_lng = des_job_lng
        this.des_job_lat = des_job_lat
        this.des_job_dev_id = des_job_dev_id
    }

}

export class Device {
    constructor( 
        adm = new Admin( ),
        hdr = new Header( ),
        cfg = new Config( ),
        evt = new Event( ),
        smp = new Sample( ),
        job = new Job( ),
        reg = new DESRegistration( ), 
    ) { 
        this.adm = adm
        this.hdr = hdr
        this.cfg = cfg
        this.evt = evt
        this.smp = smp
        this.job = job
        this.reg = reg 
        this.socket = false
    }
    
    update( ) { DEVICES.update( ( ) => { return [ ...get(DEVICES) ] } ) }

    /* WS CONNECTION */
    disconnectWS( ) { }
    connectWS( user ) {

        let reg = encodeURIComponent(JSON.stringify( this.reg ) )
        let url = `${ API_URL_C001_V001_DEVICE_USER_WS }?access_token=${ user.token }&des_reg=${ reg }`
        const ws = new WebSocket( url )
        ws.onopen = ( e ) => { console.log( "class Device -> WebSocket OPEN" )  }
        ws.onerror = ( e ) => { 
            ws.close( )
            this.socket = true
            console.log( `class Device -> ${ this.reg.des_dev_serial } -> WebSocket ERROR\n${ JSON.stringify( e )  }\n` ) 
            this.update( ) 
        }
        ws.onmessage = ( e ) => {

            let msg = JSON.parse( JSON.parse( e.data ) )
            switch ( msg.type ) {
            
                case "admin":
                    this.adm = msg.data
                    break

                case "header":
                    this.hdr = msg.data
                    break

                case "config":
                    this.cfg = msg.data
                    break
                
                case "event":
                    this.evt = msg.data
                    break
    
                case "sample":
                    this.smp = msg.data
                    // console.log( `sample -> ${ this.reg.des_dev_serial }:\n`, this.smp )
                    if ( this.job.samples ) {
                        this.job.samples.push( msg.data )
                    } else {
                        this.job.samples = [ msg.data ]
                    }
                    // console.log( `sample -> ${ this.reg.des_dev_serial }:\n`, this.job )
                    this.job.updateChartData()
                    break

                default: 
                    console.log( `Type unknown:\n${ e.data }\n` )
                    break
            }
            
            // console.log( `class Device -> ${ this.reg.des_dev_serial } ONMESSAGE:\n`, msg.data )
            this.update( )
        } 

        this.disconnectWS =  ( ) => {
            ws.send( "close" )
            ws.close( ) 
            console.log( `class Device -> ${ this.reg.des_dev_serial } -> WebSocket CLOSED` ) 
            this.socket = false
            this.update( )
        }

        this.socket = true
        this.update( )
    }

    startJob = async( ) => {
        console.log( "Start new job for device: ", this.reg.des_dev_serial ) 

        let au = get( AUTH )

        this.adm.adm_user_id = au.id
        this.adm.adm_app = client_app

        this.cfg.cfg_user_id = au.id
        this.cfg.cfg_app = client_app

        this.hdr.hdr_user_id = au.id
        this.hdr.hdr_app = client_app
        this.hdr.hdr_job_end = -1

        this.reg.des_job_reg_user_id = au.id
        this.reg.des_job_reg_app = client_app

        let dev = {
            adm: this.adm,
            hdr: this.hdr,
            cfg: this.cfg,
            reg: this.reg
        }
        console.log( "Send START JOB Request:\n", dev ) 
        
        let req = new Request( API_URL_C001_V001_DEVICE_START, { 
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ au.token }` 
            },
            body: JSON.stringify( dev )
        } )
        let res = await fetch( req )
        let reg = await res.json( )
        console.log("des_api.js -> device.startJob( ) ->  RESPONSE reg:\n", reg )

        if ( reg.status === "success" ) { 
            console.log("Start Job Request -> SUCCESS:\n", this.reg.des_dev_serial )
            if ( !this.socket ) {
                this.connectWS( au )
            }
        }
    }

    endJob = async( ) => {
        console.log( "End current job for device: ", this.reg.des_dev_serial ) 

        let au = get( AUTH )
        this.reg.des_job_reg_app = client_app
        this.reg.des_job_reg_user_id = au.id
        let dev = {
            reg: this.reg
        }
        console.log( "Send END JOB Request:\n", dev ) 
        
        let req = new Request( API_URL_C001_V001_DEVICE_END, { 
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ au.token }` 
            },
            body: JSON.stringify( dev )
        } )
        let res = await fetch( req )
        let reg = await res.json( )
        console.log(`des_api.js -> device.endJob( ${ this.reg.des_job_name } ) ->  RESPONSE reg:\n`, reg )
        
        if ( reg.status === "success" ) { 
            console.log("End Job Request -> SUCCESS:\n", this.reg.des_dev_serial )
            if ( !this.socket ) {
                this.connectWS( au )
            }
        }
    }

    getJob = async( job_name = this.hdr.hdr_job_name ) => {
        console.log( `Get job: ${ job_name } for device: ${ this.reg.des_dev_serial }`, ) 
        let au = get( AUTH )
        this.reg.des_job_reg_app = client_app
        this.reg.des_job_reg_user_id = au.id
        this.reg.des_job_name = job_name 
        console.log( "Send GET JOB Request:\n", this.reg ) 

        let req = new Request( "", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ au.token }` 
            },
            body: JSON.stringify( this.reg )
        } )
        let res = await fetch( req )
        let reg = await res.json( )
        console.log(`des_api.js -> device.getJob( ${ job_name } ) ->  RESPONSE reg:\n`, reg )
    }
}

/* JOB DATA STRUCTURES ********************************************************************************/

export class Job {
    constructor(
        admins = [ ],
        headers = [ ],
        configs = [ ],
        events = [ ],
        samples = [ ],
        xypoints = [ ],
        reg = new DESRegistration( ),
    ) {
        this.admins = admins
        this.headers = headers
        this.configs = configs
        this.events = events
        this.samples = samples
        this.xypoints = xypoints
        this.reg = reg
        
        this.geo = new GeoJSONFeature(
            new GeoJSONGeometry( [ this.reg.des_job_lng, this.reg.des_job_lat ] ),
            // this.headers[0].hdr_well_name
            "whatever"
        )
        this.geo.geometry.coordinates = [ this.reg.des_job_lng, this.reg.des_job_lat ]

        this.cht = NewChartData( )
        this.cht_ch4 = this.cht.data.datasets[0]
        this.cht_ch4.data = [ { x: this.samples[0].smp_time, y: this.samples[0].smp_ch4 } ] // this.xypoints.ch4

        this.cht_hi_flow = this.cht.data.datasets[1]
        this.cht_hi_flow.data = [ { x: this.samples[0].smp_time, y: this.samples[0].smp_hi_flow } ] // this.xypoints.hi_flow
        
        this.cht_lo_flow = this.cht.data.datasets[2]
        this.cht_lo_flow.data = [ { x: this.samples[0].smp_time, y: this.samples[0].smp_lo_flow } ] // this.xypoints.lo_flow
        
        this.cht_press = this.cht.data.datasets[3]
        this.cht_press.data = [ { x: this.samples[0].smp_time, y: this.samples[0].smp_press } ] // this.xypoints.press
        
        this.cht_bat_amp = this.cht.data.datasets[4]
        this.cht_bat_amp.data = [ { x: this.samples[0].smp_time, y: this.samples[0].smp_bat_amp } ] // this.xypoints.bat_amp
        
        this.cht_bat_volt = this.cht.data.datasets[5]
        this.cht_bat_volt.data = [ { x: this.samples[0].smp_time, y: this.samples[0].smp_bat_volt } ] // this.xypoints.bat_volt
        
        this.cht_mot_volt = this.cht.data.datasets[6]
        this.cht_mot_volt.data = [ { x: this.samples[0].smp_time, y: this.samples[0].smp_mot_volt } ] // this.xypoints.mot_volt

        if ( this.cht_ch4.data ) {
            this.cht_x_min = this.cht_ch4.data[0].x
            this.cht_x_max = this.cht_ch4.data[ this.cht_ch4.data.length - 1 ].x
        } else {
            this.cht_x_max = Date.now( ) // console.log( "this.cht_x_max", this.cht_x_max )
            this.cht_x_min = this.cht_x_max - 60  // console.log( "this.cht_x_min", this.cht_x_min )
        }            
        // this.cht_x_max = Date.now( ) // console.log( "this.cht_x_max", this.cht_x_max )
        // this.cht_x_min = this.cht_x_max  // console.log( "this.cht_x_min", this.cht_x_min )

        this.cht_point_limit = 50
        this.cht_scale_margin = 0.1
        // this.sample = new Sample( )
    }
    
    /* CHART DATA */
    updateChartData( ) {

        // if ( this.cht_ch4.data.length > this.cht_point_limit ) {
        //     this.cht.options.scales.x.min = this.cht_ch4.data[  this.cht_ch4.data.length - this.cht_point_limit ].x
        // // } else {
        // //     this.cht.options.scales.x.min = this.sample.smp_time
        // }

        // this.sample = this.samples[ this.samples.length - 1 ]
        let sample = this.samples[ this.samples.length - 1 ]
        // let sample = this.smp

        this.cht.pushPoint( 
            // { x: this.sample.smp_time, y: this.sample.smp_ch4 },
            { x: sample.smp_time, y: sample.smp_ch4 },
            this.cht_ch4, this.cht.options.scales.y_ch4,
            this.cht_point_limit,
            this.cht_scale_margin
        )
        
        this.cht.pushPoint( 
            // { x: this.sample.smp_time, y: this.sample.smp_hi_flow },
            { x: sample.smp_time, y: sample.smp_hi_flow },
            this.cht_hi_flow, this.cht.options.scales.y_hi_flow,
            this.cht_point_limit,
            this.cht_scale_margin
        )
        
        this.cht.pushPoint( 
            // { x: this.sample.smp_time, y: this.sample.smp_lo_flow },
            { x: sample.smp_time, y: sample.smp_lo_flow },
            this.cht_lo_flow, this.cht.options.scales.y_lo_flow,
            this.cht_point_limit,
            this.cht_scale_margin
        )
        
        this.cht.pushPoint( 
            // { x: this.sample.smp_time, y: this.sample.smp_press },
            { x: sample.smp_time, y: sample.smp_press },
            this.cht_press, this.cht.options.scales.y_press,
            this.cht_point_limit,
            this.cht_scale_margin
        )
        
        this.cht.pushPoint( 
            // { x: this.sample.smp_time, y: this.sample.smp_bat_amp },
            { x: sample.smp_time, y: sample.smp_bat_amp },
            this.cht_bat_amp, this.cht.options.scales.y_bat_amp,
            this.cht_point_limit,
            this.cht_scale_margin
        )
        
        this.cht.pushPoint( 
            // { x: this.sample.smp_time, y: this.sample.smp_bat_volt },
            { x: sample.smp_time, y: sample.smp_bat_volt },
            this.cht_bat_volt, this.cht.options.scales.y_bat_volt,
            this.cht_point_limit,
            this.cht_scale_margin
        )
        
        this.cht.pushPoint( 
            // { x: this.sample.smp_time, y: this.sample.smp_mot_volt },
            { x: sample.smp_time, y: sample.smp_mot_volt },
            this.cht_mot_volt, this.cht.options.scales.y_mot_volt,
            this.cht_point_limit,
            this.cht_scale_margin
        )
        
    }

}

/* 
WEB CLIENT -> HTTP -> DES -> MQTT -> DEVICE  
  - Device updates its administration settings
  - Device returns new administration settings
WEB CLIENT <- HTTP <- DES <- MQTT <- DEVICE  
*/
export class Admin {
    constructor( 
        adm_id = 0, // Set by DES upon database write

        adm_time = 0,
        adm_addr = "",
        adm_user_id = "",
        adm_app = client_app,
    
        adm_def_host = "",
        adm_def_port = 0,
        adm_op_host = "",
        adm_op_port = 0,
    
        adm_class = device_class,
        adm_version = device_version,
        adm_serial = "",
    
        adm_bat_hi_amp = 2.5, // Amps
        adm_bat_lo_volt = 10.5, // Volts
    
        adm_mot_hi_amp = 1.9, // Amps
    
        // adm_tilt_tgt = 90.0, // °
        // adm_tilt_mgn = 3.0, // °
        // adm_azim_tgt = 180.0, // °
        // adm_azim_mgn = 3.0, // °
    
        adm_hfs_flow = 200.0, // L/min
        adm_hfs_flow_min =150.0, // L/min
        adm_hfs_flow_max = 250.0, // L/min
        adm_hfs_press =160.0, // psia
        adm_hfs_press_min = 23.0, // psia
        adm_hfs_press_max = 200.0, // psia
        adm_hfs_diff = 65.0, // psi
        adm_hfs_diff_min = 10.0, // psi
        adm_hfs_diff_max = 75.0, // psi
    
        adm_lfs_flow = 1.85, // L/min
        adm_lfs_flow_min = 0.5, // L/min
        adm_lfs_flow_max = 2.0, // L/min
        adm_lfs_press = 60.0, // psia
        adm_lfs_press_min = 20.0, // psia
        adm_lfs_press_max = 80.0, // psia
        adm_lfs_diff = 9.0, // psi
        adm_lfs_diff_min = 2.0, // psi
        adm_lfs_diff_max = 10.0, // psi
     ) {
        this.adm_id = adm_id, // Set by DES upon database write

        this.adm_time = adm_time,
        this.adm_addr = adm_addr,
        this.adm_user_id = adm_user_id,
        this.adm_app = adm_app,
    
        this.adm_def_host = adm_def_host,
        this.adm_def_port = adm_def_port,
        this.adm_op_host = adm_op_host,
        this.adm_op_port = adm_op_port,
    
        this.adm_class = adm_class,
        this.adm_version = adm_version,
        this.adm_serial = adm_serial,
    
        this.adm_bat_hi_amp = adm_bat_hi_amp, // Amps
        this.adm_bat_lo_volt = adm_bat_lo_volt, // Volts
    
        this.adm_mot_hi_amp = adm_mot_hi_amp, // Amps
    
        // this.adm_tilt_tgt = adm_tilt_tgt, // °
        // this.adm_tilt_mgn = adm_tilt_mgn, // °
        // this.adm_azim_tgt = adm_azim_tgt, // °
        // this.adm_azim_mgn = adm_azim_mgn, // °
    
        this.adm_hfs_flow = adm_hfs_flow, // L/min
        this.adm_hfs_flow_min =adm_hfs_flow_min, // L/min
        this.adm_hfs_flow_max = adm_hfs_flow_max, // L/min
        this.adm_hfs_press = adm_hfs_press, // psia
        this.adm_hfs_press_min = adm_hfs_press_min, // psia
        this.adm_hfs_press_max = adm_hfs_press_max, // psia
        this.adm_hfs_diff = adm_hfs_diff, // psi
        this.adm_hfs_diff_min = adm_hfs_diff_min, // psi
        this.adm_hfs_diff_max = adm_hfs_diff_max, // psi
    
        this.adm_lfs_flow = adm_lfs_flow, // L/min
        this.adm_lfs_flow_min = adm_lfs_flow_min, // L/min
        this.adm_lfs_flow_max = adm_lfs_flow_max, // L/min
        this.adm_lfs_press = adm_lfs_press, // psia
        this.adm_lfs_press_min = adm_lfs_press_min, // psia
        this.adm_lfs_press_max = adm_lfs_press_max, // psia
        this.adm_lfs_diff = adm_lfs_diff, // psi
        this.adm_lfs_diff_min = adm_lfs_diff_min, // psi
        this.adm_lfs_diff_max = adm_lfs_diff_max // psi
    }
}

/* 
WEB CLIENT -> HTTP -> DES ( LOG ) -> MQTT -> DEVICE  
  - Device updates its header settings
  - Device returns new header settings
WEB CLIENT <- HTTP <- ( JOB DB WRITE ) DES <- MQTT <- DEVICE  
*/
export class Header {
    constructor(
        hdr_id = 0, // Set by DES upon database write

        hdr_time = 0, 
        hdr_addr = "",  
        hdr_user_id = "",
        hdr_app =  client_app,
    
        /*WELL INFORMATION*/
        hdr_well_co = "", 
        hdr_well_name = "",
        hdr_well_sf_loc = "",
        hdr_well_bh_loc = "",
        hdr_well_lic = "",

        /* JOB NAME, START & STOP */
        hdr_job_name = "",
        hdr_job_start = 0,
        hdr_job_end = 0,

        /*GEO LOCATION - USED TO POPULATE A GeoJSON OBJECT */
        hdr_geo_lng = 0,
        hdr_geo_lat = 0
    ) {
        this.hdr_id = hdr_id
        
        this.hdr_time = hdr_time
        this.hdr_addr = hdr_addr
        this.hdr_user_id = hdr_user_id
        this.hdr_app = hdr_app

        this.hdr_well_co = hdr_well_co
        this.hdr_well_name = hdr_well_name
        this.hdr_well_sf_loc = hdr_well_sf_loc
        this.hdr_well_bh_loc = hdr_well_bh_loc
        this.hdr_well_lic = hdr_well_lic

        this.hdr_job_name = hdr_job_name
        this.hdr_job_start = hdr_job_start
        this.hdr_job_end = hdr_job_end
        this.hdr_geo_lng = hdr_geo_lng
        this.hdr_geo_lat = hdr_geo_lat
    }
}

/* 
WEB CLIENT -> HTTP -> DES ( LOG ) -> MQTT -> DEVICE  
  - Device updates its configuration settings
  - Device returns new configuration settings
WEB CLIENT <- HTTP <- ( JOB DB WRITE ) DES <- MQTT <- DEVICE  
*/
export class Config {
    constructor( 
        cfg_id = 0, // Set by DES upon database write

        cfg_time = 0, 
        cfg_addr = "",  
        cfg_user_id = "",
        cfg_app =  client_app,
    
        cfg_scvd = 596.8, // m
        cfg_scvd_mult = 10.5, // kPa / m
        cfg_ssp_rate = 1.95, // kPa / hour
        cfg_ssp_dur = 6.0, // hour
        cfg_hi_scvf = 201.4, //  L/min ( 290 m3/day )
        cfg_flow_tog = 1.85, //  L/min 
    
        cfg_vlv_tgt = 2, // vent
        cfg_vlv_pos = 2, // vent
    
        cfg_op_sample = 1000, // milliseconds
        cfg_op_log = 10000, // milliseconds
        cfg_op_trans = 60000, // milliseconds
        
        cfg_diag_sample = 10000, // milliseconds
        cfg_diag_log = 100000, // milliseconds
        cfg_diag_trans = 600000, // milliseconds
     ) {
        this.cfg_id = cfg_id // Set by DES upon database write
    
        this.cfg_time = cfg_time
        this.cfg_addr = cfg_addr
        this.cfg_user_id = cfg_user_id
        this.cfg_app = cfg_app
    
        this.cfg_scvd = cfg_scvd // m
        this.cfg_scvd_mult = cfg_scvd_mult // kPa / m
        this.cfg_ssp_rate = cfg_ssp_rate // kPa / hour
        this.cfg_ssp_dur = cfg_ssp_dur // hour
        this.cfg_hi_scvf = cfg_hi_scvf //  L/min ( 290 m3/day )
        this.cfg_flow_tog = cfg_flow_tog //  L/min 
    
        this.cfg_vlv_tgt = cfg_vlv_tgt // vent
        this.cfg_vlv_pos = cfg_vlv_pos // vent
    
        this.cfg_op_sample = cfg_op_sample // milliseconds
        this.cfg_op_log = cfg_op_log // milliseconds
        this.cfg_op_trans = cfg_op_trans // milliseconds
        
        this.cfg_diag_sample = cfg_diag_sample // milliseconds
        this.cfg_diag_log = cfg_diag_log // milliseconds
        this.cfg_diag_trans = cfg_diag_trans // milliseconds
    }
}

/* 
WEB CLIENT -> HTTP -> DES ( JOB DB WRITE ) -> MQTT -> DEVICE  
  - Device loggs event to as is memory ( no reponse )
  
WEB CLIENT <- HTTP <- ( JOB DB WRITE ) DES <- MQTT <- DEVICE  
  - Device has encountered an alarm / logged an event
*/
export class Event {
    constructor( 
        evt_id = 0, // Set by DES upon database write

        evt_time = 0,
        evt_addr = "",
        evt_user_id = "",
        evt_app = client_app,
        evt_code = 0,
        evt_title = "",
        evt_msg = "" 
    ) {
        this.evt_id = evt_id // Set by DES upon database write
        this.evt_time = evt_time
        this.evt_addr = evt_addr
        this.evt_user_id = evt_user_id
        this.evt_app = evt_app
        this.evt_code = evt_code
        this.evt_title = evt_title
        this.evt_msg = evt_msg
    }
}
export class EventType {
    constructor(
        evt_type_id = 0,
        evt_type_code = 0,
        evt_typ_name = "",
        evt_typ_desc = "",
    ) {
        this.evt_type_id = evt_type_id
        this.evt_type_code = evt_type_code
        this.evt_typ_name = evt_typ_name
        this.evt_typ_desc = evt_typ_desc
    }
}
/* 
WEB CLIENT <- HTTP <- ( JOB DB WRITE ) DES <- MQTT <- DEVICE  
  - Device has transmitted a sample
*/
export class Sample {
    constructor ( 
        smp_id = 0,
        smp_time = 0,
        smp_ch4 = 100.0,
        smp_hi_flow = 250.0,
        smp_lo_flow = 2.0,
        smp_press = 1500.0,
        smp_bat_amp = 0.35,
        smp_bat_volt = 12.5,
        smp_mot_volt = 12.0,
        smp_vlv_tgt = 2,
        smp_vlv_pos = 2,
        smp_job_name =""
    ) { 
        this.smp_id = smp_id
        this.smp_time = smp_time
        this.smp_ch4 = smp_ch4
        this.smp_hi_flow = smp_hi_flow
        this.smp_lo_flow = smp_lo_flow
        this.smp_press = smp_press
        this.smp_bat_amp = smp_bat_amp
        this.smp_bat_volt = smp_bat_volt
        this.smp_mot_volt = smp_mot_volt
        this.smp_vlv_tgt = smp_vlv_tgt
        this.smp_vlv_pos = smp_vlv_pos
        this.smp_job_name =smp_job_name
    }
}

/* 
WEB CLIENT <- HTTP <- ( JOB DB WRITE ) DES <- MQTT <- DEVICE  
  - Device has transmitted a diagnostic sample
*/
export class DiagSample { /* NOT IMPLEMENTED */
    /* NOT IMPLEMENTED */
}

export class XYSampleData { 
    constructor(
        xy_smp = {
            ch4: [ new XYPoint( ) ],
            hi_flow: [ new XYPoint( ) ],
            lo_flow: [ new XYPoint( ) ],
            press: [ new XYPoint( ) ],
            bat_amp: [ new XYPoint( ) ],
            bat_volt: [ new XYPoint( ) ],
            mot_volt: [ new XYPoint( ) ],
            vlv_tgt: [ new XYPoint( ) ],
            vlv_pos: [ new XYPoint( ) ],
        }
    ) {
        this.ch4 = xy_smp.ch4
        this.hi_flow = xy_smp.hi_flow
        this.lo_flow = xy_smp.lo_flow
        this.press = xy_smp.press
        this.bat_amp = xy_smp.bat_amp
        this.bat_volt = xy_smp.bat_volt
        this.mot_volt = xy_smp.mot_volt
        this.vlv_tgt = xy_smp.vlv_tgt
        this.vlv_pos = xy_smp.vlv_pos
    }
 }

/* 
DEMO! - NOT FOR PRODUCTION 
*/
export class DemoDevice {
    constructor( 
        dev = new Device( ), 
        sim = new Sim( ),
    ) { 
        this.dev = dev
        this.sim = sim
    }

    update( ) {
        let demos
        const unsub = DEMO_DEVICES.subscribe( ( v ) => { demos = v } )
        unsub( )
        DEMO_DEVICES.update( ( ) => { return [ ...demos ] } )
    }

   disconnectSIM( ) { /* DEMO! - NOT FOR PRODUCTION */ } 
   connectSIM( user ) { /* DEMO! - NOT FOR PRODUCTION */

        let sim_js = encodeURIComponent(JSON.stringify( this.sim ) )
        let reg_js = encodeURIComponent(JSON.stringify( this.dev.reg ) ) 
        let url = `${ API_URL_GET_RUN_DEMO_SIM }?access_token=${ user.token }&sim=${ sim_js }&des_reg=${ reg_js }`

        console.log( `connectSIM( ) ->  this.dev: ${ JSON.stringify( this.dev.reg.des_dev_serial, null, 4 ) }`  )
        let ws = new WebSocket( url )

        ws.onopen = ( e ) => { console.log( "class DemoDevice -> WebSocket OPEN" )  }
        ws.onerror = ( e ) => {
            ws.close( )
            this.sim.run = false
            console.log( `class DemoDevice -> ${ this.dev.reg.des_dev_serial } ONERROR:\n`, JSON.stringify( e ) )
            this.update( )
        }
        ws.onmessage = ( msg ) => {
        
            let data =  JSON.parse( JSON.parse( msg.data ) )
            console.log( `class DemoDevice: ${ this.dev.reg.des_dev_serial } ONMESSAGE:\n`, data )
            this.update( )
        } 
        this.sim.run = true
       
        this.disconnectSIM = ( ) => { 
                ws.send( "close" )
                ws.close( ) 
                this.sim.run = false
                console.log( `class DemoDevice -> ${ this.dev.reg.des_dev_serial } -> WebSocket CLOSED: -> sim ${ this.sim.run }\n` )
                this.update( )
        }
        this.update( )
   }
}

export class Sim {
    constructor(
	    qty = 1000,
	    dur = 500,
	    fillQty = 1,
        max_ch4 = 92.1 + Math.random( ) * 7.9,
        max_flow = 0.199 + Math.random( ) * 248.799,
        run = false,
    ) {
        this.qty = qty
        this.dur = dur
        this.fillQty = fillQty
        this.run = run
        this.max_ch4 = max_ch4
        this.max_flow = max_flow
        this.max_press = ( this.max_flow / 250 ) * 1000

        this.modeVent( )
    }

    modeVent( ) {
        this.mtx_ch4 = new DemoModeTransition( this.max_ch4, 0, 600000, 600000 )
        this.mtx_hi_flow = new DemoModeTransition( this.max_flow, 0, 600000, 500000 )
        this.mtx_lo_flow = new DemoModeTransition( ( this.max_flow > 2 ? 2 : this.max_flow ), 0, 600000, 500000 )
        this.mtx_press = new DemoModeTransition( this.pax_press, 0, 600000, 600000 )
        // console.log( "modeVent( ):\n", this )
    }

    modeFlow( ) {
        this.mtx_ch4 = new DemoModeTransition( 0, this.max_ch4, 600000, 600000 )
        this.mtx_hi_flow = new DemoModeTransition( 0, this.max_flow, 600000, 500000 )
        this.mtx_lo_flow = new DemoModeTransition( 0, ( this.max_flow > 2 ? 2 : this.max_flow ), 600000, 500000 )
        this.mtx_press = new DemoModeTransition( this.pax_press, 0, 600000, 600000 )
        // console.log( "modeFlow( ):\n", this )
    }

    modeBuild( ) {
        this.mtx_ch4 = new DemoModeTransition( this.max_ch4, 0, 600000, 600000 )
        this.mtx_hi_flow = new DemoModeTransition( this.max_flow, 0, 600000, 500000 )
        this.mtx_lo_flow = new DemoModeTransition( ( this.max_flow > 2 ? 2 : this.max_flow ), 600000, 500000 )
        this.mtx_press = new DemoModeTransition( 0, this.pax_press, 600000, 600000 )
        // console.log( "modeBuild( ):\n", this )
    }

}

export class DemoModeTransition {
    constructor(
        v_min = 0,
        v_max = 0,
        span_up = 10000,
        span_dn = 10000,
    ) {
        this.v_min = v_min
        this.v_max = v_max
        this.span_up = span_up
        this.span_dn = span_dn
    }
}

export const MODE_BUILD_CSS = 'fg-yellow'
export const MODE_VENT_CSS = 'fg-red'
export const MODE_HIGH_FLOW_CSS = 'fg-blue'
export const MODE_LOW_FLOW_CSS = 'fg-aqua'
export const MODE = [
   'BUILD', // 0
   'BUILD <-> VENT', // 1
   'VENT', // 2
   'VENT <-> HI FLOW', // 3
   'HI FLOW', // 4
   'HI FLOW <-> LO FLOW', // 5
   'LO FLOW', // 6
   'MANUAL >-<' // 7
]


/* MAP STUFF ********************************************************************************************/
export class GeoJSONFeatureCollection {
    constructor (
        features = [ ]
    ) {
        this.type = "FeatureCollection"
        this.features = features
    }
}

export class GeoJSONFeature {
    constructor(
        geometry = new GeoJSONGeometry( ),
        well_name = ""
    ) {
        this.type = "Feature"
        this.geometry = geometry
        this.well_name = well_name
    }
}

export class GeoJSONGeometry {
    constructor( 
        coordinates = [ -115.000000, 55.000000 ]
    ) {
        this.type = "Point"
        this.coordinates = coordinates
    }
}


/* CHART STUFF ******************************************************************************************/

import { BASE, RGBA } from './common/colors'
export const COLORS = {
    CH4: BASE.PINK,
    HI_FLOW: BASE.BLUE,
    LO_FLOW: BASE.AQUA,
    PRESS: BASE.YELLOW,
    BAT_AMP: BASE.RED,
    BAT_VOLT: BASE.ORANGE,
    MOT_VOLT: BASE.PURPLE
}

import { LineChartModel, LineChartXScale, LineChartScale, LineChartDataSet, CHART_LINE_WIDTH, CHART_MARKER_RADIUS } from './common/chart/line_chart'
const NewChartDataSets = ( ) => {
    return [

         /* 0 */
        new LineChartDataSet( [ { x: 0, y: 0.0 } ], "Methane", "y_ch4", true,
            CHART_LINE_WIDTH, RGBA( COLORS.CH4, 0.3 ), 
            CHART_MARKER_RADIUS, RGBA( COLORS.CH4, 0.7 ) 
        ),

         /* 1 */
        new LineChartDataSet( [ { x: 0, y: 0.0 } ], "High Flow", "y_hi_flow", true, 
            CHART_LINE_WIDTH, RGBA( COLORS.HI_FLOW, 0.3 ), 
            CHART_MARKER_RADIUS, RGBA( COLORS.HI_FLOW, 0.7 ) 
        ),  

         /* 2 */
        new LineChartDataSet( [ { x: 0, y: 0.0 } ], "Low Flow", "y_lo_flow", true,
            CHART_LINE_WIDTH,  RGBA( COLORS.LO_FLOW, 0.3 ), 
            CHART_MARKER_RADIUS, RGBA( COLORS.LO_FLOW, 0.7 ) 
        ),

         /* 3 */
        new LineChartDataSet( [ { x: 0, y: 0.0 } ], "Pressure", "y_press", true,
            CHART_LINE_WIDTH, RGBA( COLORS.PRESS, 0.3 ), 
            CHART_MARKER_RADIUS, RGBA( COLORS.PRESS, 0.7 ) 
        ),

         /* 4 */
        new LineChartDataSet( [ { x: 0, y: 0.0 } ], "Battery Amps", "y_bat_amp", true, 
            CHART_LINE_WIDTH, RGBA( COLORS.BAT_AMP, 0.3 ), 
            CHART_MARKER_RADIUS, RGBA( COLORS.BAT_AMP, 0.7 ) 
        ),

         /* 5 */
        new LineChartDataSet( [ { x: 0, y: 0.0 } ], "Battery Volts", "y_bat_volt", true,
            CHART_LINE_WIDTH, RGBA( COLORS.BAT_VOLT, 0.3 ),  
            CHART_MARKER_RADIUS, RGBA( COLORS.BAT_VOLT, 0.7 ) 
        ),

         /* 6 */
        new LineChartDataSet( [ { x: 0, y: 0.0 } ], "Motor Volts", "y_mot_volt", true,
            CHART_LINE_WIDTH, RGBA( COLORS.MOT_VOLT, 0.3 ), 
            CHART_MARKER_RADIUS, RGBA( COLORS.MOT_VOLT, 0.7 ) 
        )

    ]

}

const NewChartScales = ( ) => {

    return {
        
        x: LineChartXScale,

        y_ch4: new LineChartScale( "Ch4 ( % )", 3, -5, 100, "left", 
            RGBA( COLORS.CH4, 1.0 ), RGBA( COLORS.CH4, 0.3 ), false 
        ),
        
        y_hi_flow: new LineChartScale( "Hi Flow ( L/min )", 1.75,  2.5, 250, "left", 
            RGBA( COLORS.HI_FLOW, 1.0 ), RGBA( COLORS.HI_FLOW, 0.4 ), false 
        ),
        
        y_lo_flow: new LineChartScale( "Lo Flow ( L/min )", 1, -0.1, 2, "left",
            RGBA( COLORS.LO_FLOW, 1.0 ), RGBA( COLORS.LO_FLOW, 0.2 ), true )
         ,
        
        y_press: new LineChartScale( "Press ( psi )", 0, 0, 1000, "left", 
            RGBA( COLORS.PRESS, 1.0 ), RGBA( COLORS.PRESS, 0.3 ), false 
        ),
        
        y_bat_amp: new LineChartScale( "Bat ( A )", 0, 0, 1.5, "right", 
            RGBA( COLORS.BAT_AMP, 1.0 ), RGBA( COLORS.BAT_AMP, 0.3 ), false 
        ),
        
        y_bat_volt: new LineChartScale( "Bat ( V )", 1, 0, 15, "right", 
            RGBA( COLORS.BAT_VOLT, 1.0 ), RGBA( COLORS.BAT_VOLT, 0.3 ), false 
        ),
        
        y_mot_volt: new LineChartScale( "Mot ( V )", 2, 0, 15, "right", 
            RGBA( COLORS.MOT_VOLT, 1.0 ), RGBA( COLORS.MOT_VOLT, 0.3 ), false 
        )
    }

}
export const NewChartData = ( ) => {
    let cht = new LineChartModel( "", RGBA( BASE.LIGHT, 0.7 ) )
    cht.data.datasets = NewChartDataSets( )
    cht.options.scales = NewChartScales( )
    // Object.assign( config.options.scales, { yCH }, { yHF }, { yLF }, { yP }, { yBC }, { yBV }, { yMV } ) 

    return cht
}
