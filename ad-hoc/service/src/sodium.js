// Copyright (c) 2022 Gamercert, Inc. All Rights Reserved.

import sodium               from 'libsodium-wrappers';

// https://sodium-friends.github.io/docs/docs/api

export const HEX_REGEX  = /^[0-9a-fA-F]+$/i;

//----------------------------------------------------------------//
export function assert ( condition, error ) {

    if ( !condition ) {
        if ( error ) {
            console.log ( error );
            console.trace ();
        }
        throw new Error ( error || 'Assetion failed.' );
    }
}

//----------------------------------------------------------------//
export function fromBuffer ( value, encoding ) {

    assert ( Uint8Array.prototype.isPrototypeOf ( value ), 'Value must be of type Uint8Array.' );

    encoding = encoding || 'hex';

    switch ( encoding ) {
        case 'bytes':       return value;
        case 'base64':      return sodium.to_base64 ( value, sodium.base64_variants.ORIGINAL_NO_PADDING );
        case 'utf8':        return sodium.to_string ( value );
        case 'json':        return JSON.parse ( sodium.to_string ( value ));
        case 'hex':         return sodium.to_hex ( value );
    }

    assert ( false, 'Unknown encoding.' );
    return false;
}

//----------------------------------------------------------------//
export function hash ( plaintext, key, size, encoding ) {

    plaintext           = toBuffer ( plaintext, encoding || 'utf8' );
    key                 = key ? toBuffer ( key ) : undefined;

    return sodium.to_hex ( sodium.crypto_generichash ( size || sodium.crypto_generichash_BYTES_MAX, plaintext, key ));
}

//----------------------------------------------------------------//
export async function initAsync () {

    await sodium.ready;
}

//----------------------------------------------------------------//
export function randomBytes ( size, encoding ) {

    return fromBuffer ( sodium.randombytes_buf ( size ), encoding || 'bytes' );
}

//----------------------------------------------------------------//
export function toBuffer ( value, encoding ) {

    if ( Uint8Array.prototype.isPrototypeOf ( value )) return value;

    encoding = encoding || 'hex';

    switch ( encoding ) {
        case 'base64':      return sodium.from_base64 ( value, sodium.base64_variants.ORIGINAL_NO_PADDING );
        case 'utf8':        return sodium.from_string ( value );
        case 'json':        return sodium.from_string ( JSON.stringify ( value ));
        case 'hex': {

            if ( value ) {
                const isString = (( typeof ( value ) === 'string' ) || ( value instanceof String ));
                assert (( isString && HEX_REGEX.test ( value )), 'Value must be a hex-encoded string.' );
                assert ((( value.length % 2 ) === 0 ), 'Hex-encoded string must have an even number of characters.' );
            }
            return sodium.from_hex ( value.toUpperCase ());
        }
    }

    assert ( false, 'Unknown encoding.' );
    return false;
}

//----------------------------------------------------------------//
export function verify ( ciphertext, publicKey, encoding ) {

    const plaintext = sodium.crypto_sign_open (
        toBuffer ( ciphertext ),
        toBuffer ( publicKey)
    );

    return plaintext ? fromBuffer ( plaintext, encoding || 'utf8' ) : false;
}
