'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { startRegistration } from '@simplewebauthn/browser';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { create, register, rename } from '@/actions/passkeys';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const nameSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long' }),
});

export const Register = () => {
  const [isPending, startTransition] = useTransition();
  const [id, setId] = useState<string>();
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
  });

  async function handleSubmit(data: z.infer<typeof nameSchema>) {
    if (!id) {
      return;
    }

    startTransition(() =>
      rename(id, data.name).then(() => {
        setOpen(false);
        setId(undefined);
      })
    );
  }

  async function handleRegister() {
    try {
      const data = await create();
      // Pass the options to the authenticator and wait for a response
      const attResp = await startRegistration({ ...data });
      // POST the response to the endpoint that calls
      // @simplewebauthn/server -> verifyRegistrationResponse()
      const id = await register(attResp);

      setId(id);
      setOpen(true);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleRegister}>
        Register a PassKey
      </Button>
      <Dialog open={open} onOpenChange={setOpen} modal={true}>
        <DialogContent className="flex flex-col gap-2 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Passkey Setup</DialogTitle>
            <DialogDescription>
              Enter a name for your passkey to help you identify it in your account.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Passkey #1" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is a helpful name for you to identify it in your account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  Confirm
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
