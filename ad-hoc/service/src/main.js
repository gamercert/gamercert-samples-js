// Copyright (c) 2022 Gamercert, Inc. All Rights Reserved.

process.on ( 'uncaughtException', function ( err ) {
    console.log ( err );
    process.exit ( 1 );
});

import bodyParser                   from 'body-parser';
import express                      from 'express';
import fetch                        from 'cross-fetch';
import fs                           from 'fs';
import * as jwtutil                 from 'jwtutil';
import _                            from 'lodash';
import path                         from 'path';
import * as sodium                  from 'sodium';

const PORT              = 8008;
const JWT_SIGNING_KEY   = 'd1168613e7f71f6416047538edd9ad6699e12e3f32fadd2ffdc2ebd5efcf5b0f';

//----------------------------------------------------------------//
( async () => {

    await sodium.initAsync ();

    const server = express ();

    server.use ( function ( req, res, next ) {
        res.header ( 'Access-Control-Allow-Origin', '*' );
        res.header ( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
        res.header ( 'Access-Control-Allow-Methods', 'GET, OPTIONS, POST' );
        next ();
    });

    server.use ( bodyParser.json ({
        verify: ( req, res, buf ) => {
            req.rawBody = buf;
        }
    }));
    server.use ( bodyParser.urlencoded ({ extended: true }));

    let router = express.Router ();

    // just an example auth middleware; checks the JWT and sets a flag for use in the handler.
    router.use (( request, response, next ) => {
        if ( request.query.token && ( request.query.token !== 'none' )) {
            const jwtClaims = jwtutil.verify ( request.query.token, JWT_SIGNING_KEY );
            if ( jwtClaims && jwtClaims.mature ) {
                request.authorized = true;
            }
        }
        next ();
    });

    router.get      ( '/challenge',             getChallengeAsync ); // generate a challenge string
    router.post     ( '/claim',                 postClaimAsync ); // verify a claim

    router.get ( '/', ( request, response ) => {
        const message = {
            type: 'GAMERCERT AD HOC',
        };
        response.json ( message );
    });

    server.use ( '/', router );

    await server.listen ( PORT );
    console.log ( 'LISTENING ON PORT:', PORT );
        
})();

//----------------------------------------------------------------//
async function getChallengeAsync ( request, response ) {

    const nonce         = sodium.randomBytes ( 8, 'hex' );

    response.json ({
        challenge:      `over18.${ nonce }`,
        token:          jwtutil.create ({ nonce: nonce }, JWT_SIGNING_KEY ),
    });
}

//----------------------------------------------------------------//
async function postClaimAsync ( request, response ) {

    try {

        const token         = request.body.token;
        const claimString   = request.body.claim;

        sodium.assert ( token && claimString );

        const jwtClaims = jwtutil.verify ( token, JWT_SIGNING_KEY );

        sodium.assert ( jwtClaims );
        sodium.assert ( jwtClaims.nonce );

        const claimComponents = claimString.split ( '.' );
        sodium.assert ( claimComponents.length === 5 );

        const claim = {
            type:           claimComponents [ 0 ],
            nonce:          claimComponents [ 1 ],
            salt:           claimComponents [ 2 ],
            keyName:        claimComponents [ 3 ],
            signature:      claimComponents [ 4 ],
        }

        sodium.assert ( claim.type );
        sodium.assert ( claim.nonce );
        sodium.assert ( claim.salt );
        sodium.assert ( claim.keyName );
        sodium.assert ( claim.signature );

        sodium.assert ( claim.nonce === jwtClaims.nonce );

        const keyResult = await ( await fetch ( `http://localhost:7777/sig/keys/${ claim.keyName }` )).json ();
        sodium.assert ( keyResult.publicKey );

        const hash      = sodium.hash ( `${ claim.nonce }${ claim.salt }` );
        const message   = `${ claim.type }.${ hash }`;
        const verified  = sodium.verify ( claim.signature, keyResult.publicKey, 'utf8' );

        sodium.assert ( verified === message );

        response.json ({
            type:           claim.type,
            token:          jwtutil.create ({ mature: true }, JWT_SIGNING_KEY ),
        });
        return;
    }
    catch ( error ) {
        console.log ( error );
    }
    response.status ( 400 ).send ( '400: Bad request.' );
}
