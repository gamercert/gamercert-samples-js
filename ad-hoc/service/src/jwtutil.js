// Copyright (c) 2022 Gamercert, Inc. All Rights Reserved.

import _                        from 'lodash';
import njwt                     from 'njwt';
import * as sodium              from 'sodium';

//================================================================//
// jwtutil
//================================================================//

//----------------------------------------------------------------//
export function create ( claims, signingKeyHex ) {

    const signingKey = Buffer.from ( signingKeyHex, 'hex' );

    try {
        return njwt.create ( claims, signingKey ).compact ();
    }
    catch ( error ) {
        console.log ( error );
    }
}

//----------------------------------------------------------------//
export function makeSigningKey () {

    return sodium.randomBytes ( 32, 'hex' );
}

//----------------------------------------------------------------//
export function verify ( jwt64, signingKeyHex ) {

    if ( !( jwt64 && ( typeof ( jwt64 ) === 'string' ))) return false;

    const signingKey = Buffer.from ( signingKeyHex, 'hex' );

    try {
        return njwt.verify ( jwt64, signingKey ).body || false;
    }
    catch ( error ) {
        console.log ( error );
        return false;
    }
}
