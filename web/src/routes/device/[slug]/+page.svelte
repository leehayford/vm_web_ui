<script>
    
    import { getContext, onMount } from 'svelte'

    import { debug } from '../../../lib/des/utils'
    import { AUTH, RoleCheck } from '../../../lib/des/api'
    import LineChart from '../../../lib/common/chart/LineChart.svelte'
    // import LineChartChan from '../../../lib/common/chart/LineChartChan.svelte'
    import Modal from '../../../lib/common/modal/Modal.svelte'
    
    import { getDevices, updateDevicesStore } from '../../../lib/c001v001/device'
    import { newChartScales } from '../../../lib/c001v001/chart_display'
    import HeaderPanel from "../../../lib/c001v001/components/header/HeaderPanel.svelte"
    import ConfigPanel from "../../../lib/c001v001/components/config/ConfigPanel.svelte"
    import EventPanelOp from "../../../lib/c001v001/components/event/EventPanelOp.svelte"

    import DeviceInfo from '../DeviceInfo.svelte'
    import DeviceStartPanel from '../DeviceStartPanel.svelte'
    
    export let data
    $: DEVICES = getContext(  'devices' )
    $: DEVICES_LOADED = getContext( 'devices_loaded' )
    $: device = $DEVICES.filter( ( d ) => { return d.reg.des_dev_serial == data.serial } )[0]

    // $: channels = [ ]
    // const getChannels = ( ) => {
    //     channels = [ ]
    //     device.cht.data.datasets.forEach(set => {
    //         let scale = device.cht.getDatasetScale( set )
    //         if ( scale.title.text )
    //             channels.push( { set, scale } )
    //     });
        
        
    // }
    // const updateSettings = async( ) => {
    //     await updateDevicesStore( )
    // }

    let waitingForDevice = true
    $: {
        if ( device && waitingForDevice === true ) { 
            debug( "DEVICES_LOADED: ", $DEVICES_LOADED )
            waitingForDevice = !$DEVICES_LOADED
            if ( !waitingForDevice ) {
                if ( device.isActive( ) )
                    device.qryActiveSampleSet( )
                // getChannels( )
            }
        }
    }
    
    const toggleAuto = ( ) => {
        device.cht_auto_scale = !device.cht_auto_scale
        if ( !device.cht_auto_scale ) 
            device.cht.options.scales = newChartScales( )
        updateDevicesStore( )
    }

    /* CALLED IF USER REFRESHES OR NAVIGATED DIRECTLY TO THIS PAGE */
    onMount( async( ) => { waitingForDevice = true } )

    /* USED TO EXPOSE THE MODALS' OPEN( ) METHOD 
    SO IT CAN BE CALLED FROM OTHER COMPONENTS */
    let startModal
    let endModal

</script>

<dvi class="flx-col container">

    { #if device }
    <div class="flx-row content">

        <Modal bind:this={ startModal } on:confirm={ async( ) => { device.startJob( ) } }>
            <h3 class='fg-accent' slot="title">Start a new job</h3>
            <div slot="content" class="flx-row">
                <DeviceStartPanel bind:device />
            </div>
            <div slot="footer">Send command</div>
        </Modal>
     
        <Modal bind:this={ endModal } on:confirm={ async( ) => { device.endJob( ) } }>
            <h3 class='fg-accent' slot="title">End job</h3>
            <div slot="content" class="flx-col end-modal">
                <h3>Are you sure you want to proceed?</h3>
                <h4>Click confirm to end the current job.</h4>
                <h4>This action cannot be undone.</h4>
            </div>
            <div slot="footer">Send command</div>
        </Modal>
     
        <!-- on:click={ toggleAuto } on:keydown -->
        <div class="flx-col status">
            <DeviceInfo bind:device on:start={ startModal.open } on:end={ endModal.open } />
        </div>
        
        <div class="flx-col panel">
    
            <div class="flx-col chart">
                <LineChart bind:chartdata={ device.cht } />
            </div>
    
            <div class="flx-row action">

                <!-- <div class="flx-col panel-cont">
                    { #each channels as chn, index ( index ) }
                        <LineChartChan bind:dataset={ chn.set } bind:scale={ chn.scale } on:update={ updateSettings }/>
                    { /each }
                </div> -->

                <div class="flx-col panel-cont">
                    <HeaderPanel bind:device />
                </div>

                <div class="flx-col panel-cont">
                    <ConfigPanel bind:device />
                </div>

                <div class="flx-col panel-cont">
                    <EventPanelOp bind:device />
                </div>

            </div>

        </div>
      
    </div>

    { /if }
</dvi>

<style>

    .container {
        overflow: hidden;
        height: 100%;
        gap: 1rem;
    }

    .content { 
        height: 100%;
    }

    .status {
        max-width: 25%;
        min-width: 25%;
        width: auto;
        padding-right: 0.5em;
    }

    .panel {
        padding: 0 1em;
        padding-left: 0;
        height: auto;
    }

    .chart { min-height: 38em; }

    .action {
        overflow: hidden;
        justify-content: space-between;
        height: 100%;
    }

    .panel-cont { 
        background-color: var(--light_002);
        border-bottom: solid 0.05em var(--light_01);
        border-right: solid 0.05em var(--light_01);
        border-radius: 0.5em;
        padding: 1em;
        gap: 0.5em; 
    }

    .end-modal {
        width: auto;
    }
    /* LAP TOP */
    @media(max-width: 1440px) {
        .status {
            max-width: 33%;
            min-width: 33%;
        }
        .panel { max-width: 67%;  }
        .chart { min-height: 30em; }
    }

    /* TABLET */
    @media(max-width: 1024px) { 
        .container { 
            padding-right: 0.5em; 
        }
        .content { 
            flex-direction: column; 
            overflow-x: hidden;
            overflow-y: auto;
            padding: 0;
        }
        .status {
            max-width: 100%;
            min-width: 100%;
        }
        .panel { 
            padding-right: 0.5em; 
            max-width: 100%;  
            gap: 0.5em;
        }
        .chart { min-height: 23em; }
        .action {
            flex-direction: row;
            border: none;
            padding: 0;
        }
    }

    /* MOBILE */
    @media(max-width: 425px) { 
        .container { 
            padding-right: 0.5em; 
        }
        .content { 
            flex-direction: column; 
            overflow-x: hidden;
            overflow-y: auto;
            padding: 0;
        }
        .status {
            max-width: 100%;
            min-width: 100%;
            height: 300em;
        }
        .panel { 
            padding-right: 0.5em; 
            max-width: 100%;  
            gap: 0.5em;
        }
        .chart { display:none; padding: 0; }
        .action {
            flex-direction: column;
            border: none;
            padding: 0;
            padding-left: 0.5em;
        }
    }


</style>