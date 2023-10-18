'use client';

import { startRegistration } from '@simplewebauthn/browser';

import { create, register } from '@/actions/passkeys';
import { Button } from '@/components/ui/button';

// TODO: add stage for nickname
export const Register = () => {
  async function handleRegister() {
    try {
      const data = await create();
      // Pass the options to the authenticator and wait for a response
      const attResp = await startRegistration({ ...data });
      // POST the response to the endpoint that calls
      // @simplewebauthn/server -> verifyRegistrationResponse()
      await register(attResp);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Button variant="outline" onClick={handleRegister}>
      Register a PassKey
    </Button>
  );
};
