
<script>

    import { getContext } from "svelte"

    import InputText from "../../../common/input_text/InputText.svelte"
    import UserBadge from "../../../des/components/UserBadge.svelte"

	import { Header } from '../../models'
    
    export let hdr = new Header( )

    $: USERS = getContext( 'users' )
    $: user = $USERS.filter( u  => { return u.id == hdr.hdr_user_id } )[0]

    </script>

<div class="flx-col container">

    <div class="flx-col  card-content">

        <div class="flx-row in">
            <p class="lbl">Company:</p>
            <InputText enabled={ true } bind:txt={ hdr.hdr_well_co } place="Company name"/>
        </div>
        
        <div class="flx-row in">
            <p class="lbl">Well Name:</p>
            <InputText enabled={ true } bind:txt={ hdr.hdr_well_name } place="Well name" />
        </div>
        
        <div class="flx-row in">
            <p class="lbl">Surf Loc:</p>
            <InputText enabled={ true } bind:txt={ hdr.hdr_well_sf_loc } place="Well location / UWI"/>
        </div>
        
        <div class="flx-row in">
            <p class="lbl">Bot Loc:</p>
            <InputText enabled={ true } bind:txt={ hdr.hdr_well_bh_loc } place="Bottom-hole location"/>
        </div>
        
        <div class="flx-row in">
            <p class="lbl">License:</p>
            <InputText enabled={ true } bind:txt={ hdr.hdr_well_lic } place="Well License #"/>
        </div>

        <div class="flx-row card-title meta">
            <UserBadge bind:user={ user } />
        </div>

    </div>
    
</div>

<style>

    .container {
        min-width: 35em;
    }    

    .in {
        gap: 0.5em;
    }
    .lbl {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        color: var( --accent_a);
        width: 7em;
    }
    .meta {
        padding: 0;
        gap: 0.5em;
    }

    /* MOBILE */
    @media(max-width: 425px) { 
        
        .container {
            min-width: none;
        }  
    }
</style>