// Copyright (c) 2022 Gamercert, Inc. All Rights Reserved.

import './index.css';

import pkg                                  from '../package.json';
import registerServiceWorker                from './util/registerServiceWorker';
import _                                    from 'lodash';
import React                                from 'react';
import { useClearCache }                    from 'react-clear-cache';
import ReactDOM                             from 'react-dom';

//----------------------------------------------------------------//
const AgeClaimForm = ( props ) => {

    const [ challenge, setChallenge ]               = React.useState ( '' );
    const [ challengeToken, setChallengeToken ]     = React.useState ( '' );
    const [ claim, setClaim ]                       = React.useState ( '' );
    const [ busy, setBusy ]                         = React.useState ( false );

    const getChallenge = async () => {
        const response = await ( await fetch ( `http://localhost:8008/challenge/` )).json ();
        setChallenge ( response.challenge );
        setChallengeToken ( response.token );
    }

    React.useEffect (() => { getChallenge (); }, []);

    const onCopy = () => {
        navigator.clipboard.writeText ( challenge );
    }

    const onSubmit = async () => {

        if ( !claim ) return;
        setBusy ( true );

        try {
            const response = await ( await fetch (
                `http://localhost:8008/claim/`, {
                    method:         'POST',
                    headers:        {[ 'content-type' ]: 'application/json' },
                    body: JSON.stringify ({
                        token:      challengeToken,
                        claim:      claim,
                    })
                }
            )).json ();

            props.onAccessToken ( response.token, response.type );
        }
        catch ( error ) {
            console.log ( error );
        }

        setBusy ( false );
    }

    return (
        <form style = {{ overflow: 'visible' }} onSubmit = {( event ) => { event.preventDefault (); }}>
            <div style = {{ overflow: 'visible' }}>
                <input
                    readOnly
                    style           = {{ width: '256px' }}
                    type            = 'text'
                    value           = { challenge }
                />
                <input type = 'submit' value = 'copy' onClick = { onCopy }/>
            </div>
            <div style = {{ marginTop: '10px', overflow: 'visible' }}>
                <input
                    style           = {{ width: '256px' }}
                    type            = 'text'
                    placeholder     = 'Gamercert Age Claim'
                    value           = { claim }
                    onChange        = {( event ) => { setClaim ( event.target.value ); }}
                />
                <input type = 'submit' value = 'submit' onClick = { onSubmit }/>
            </div>
        </form>
    );
}

//----------------------------------------------------------------//
const AgeClaimMessage = ( props ) => {

    return (
        <div>
            <h3>{ props.message }</h3>
            <p style = {{ width: '100%', margin: 'auto', textAlign: 'center', color: 'white', cursor: 'pointer' }} onClick = { props.onReset }>Reset</p>
        </div> 
    );
}

//----------------------------------------------------------------//
const App = () => {

    const { isLatestVersion, emptyCacheStorage }    = useClearCache ();
    const [ claimType, setClaimType ]               = React.useState ( 'none' );
    const [ busy, setBusy ]                         = React.useState ( false );

    if ( !isLatestVersion ) {
        emptyCacheStorage ();
    }

    const onAccessToken = async ( token, type ) => {
        setClaimType ( type );
    }

    const onReset = async ( token, type ) => {
        setClaimType ( 'none' );
    }

    return (
        <div
            style = {{
                display:                'grid',
                gridTemplateRows:       'auto 24px',
                gridTemplateColumns:    'auto',
                gridTemplateAreas:      `'form' 'footer'`,
                position:               'absolute',
                width:                  '100%',
                height:                 '100%',
                background:             '#000000',
                alignItems:             'stretch',
                justifyItems:           'stretch',
            }}
        >
            <div style = {{ gridArea: 'form', position: 'relative', backgroundColor: '#000000' }}>
                 <div className = 'center' style = {{
                    width:                  'fit-content',
                    backgroundColor:        '#000',
                }}> 
                <Choose>
                    <When condition = { claimType === 'over18' }>
                        <AgeClaimMessage message = 'ACCESS GRANTED' onReset = { onReset }/>
                    </When>
                    <When condition = { claimType === 'pretend' }>
                        <AgeClaimMessage message = 'ACCESS GRANTED (PRETEND)' onReset = { onReset }/>
                    </When>
                    <Otherwise>
                        <AgeClaimForm onAccessToken = { onAccessToken }/>
                    </Otherwise>
                </Choose>
                </div>
            </div>

            <div style = {{ gridArea: 'footer', position: 'relative', backgroundColor: '#000000' }}>
                <div className = 'center'>
                    <footer>
                        { `Copyright © 2022 by Gamercert, Inc. - v${ pkg.version }` }
                    </footer>
                </div>
            </div>
        </div>
    );
}

//----------------------------------------------------------------//
ReactDOM.render (
    <App/>,
    document.getElementById ( 'root' )
);

registerServiceWorker ();
