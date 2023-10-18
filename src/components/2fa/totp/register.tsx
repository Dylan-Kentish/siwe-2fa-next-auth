'use client';

import { useEffect, useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { create, register, rename } from '@/actions/totp';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from '@/components/ui/skeleton';

const ScanQRCode: React.FC<{ next: (id: string) => void }> = ({ next }) => {
  const [data, setData] = useState<{
    id: string;
    imageUrl: string;
  } | null>(null);

  function handleClick() {
    if (data) {
      next(data.id);
    }
  }

  useEffect(() => {
    create().then(setData);
  }, []);

  return (
    <>
      <DialogHeader>
        <DialogTitle>2FA Setup</DialogTitle>
        <DialogDescription>
          Scan this QR code with your authenticator app to add your account to it.
        </DialogDescription>
      </DialogHeader>
      {data ? (
        <Image
          src={data.imageUrl}
          alt="2FA qr-code"
          className="mx-auto h-64 w-64 object-fill"
          width={256}
          height={256}
          unoptimized={true}
        />
      ) : (
        <Skeleton className="mx-auto h-64 w-64" />
      )}

      <DialogFooter>
        <Button onClick={handleClick}>Next</Button>
      </DialogFooter>
    </>
  );
};

const codeSchema = z.object({
  code: z
    .string()
    .refine(code => code.length === 6, {
      message: 'Verification code must be exactly 6 digits long',
    })
    .refine(code => /^\d+$/.test(code), {
      message: 'Verification code must consist of digits only',
    }),
});

const ConfirmCode: React.FC<{ id?: string; next: (ok: boolean) => void }> = ({ id, next }) => {
  const form = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: '',
    },
  });
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(data: z.infer<typeof codeSchema>) {
    if (!id) {
      return;
    }

    startTransition(() => register(id, data.code).then(next));
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>2FA Setup</DialogTitle>
        <DialogDescription>
          Enter the code from your authenticator app to confirm that it is working.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="123456" {...field} />
                </FormControl>
                <FormDescription>This is the code from your authenticator app.</FormDescription>
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
    </>
  );
};

const nameSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long' }),
});

const AppName: React.FC<{ id?: string; next: (ok: boolean) => void }> = ({ id, next }) => {
  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
  });
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(data: z.infer<typeof nameSchema>) {
    if (!id) {
      return;
    }

    startTransition(() => rename(id, data.name).then(next));
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>2FA Setup</DialogTitle>
        <DialogDescription>
          Enter a name for your authenticator app to help you identify it in your account.
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
                  <Input placeholder="Authenticator app #1" {...field} />
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
    </>
  );
};

export const Register: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<'scan' | 'confirm' | 'name'>('scan');
  const [id, setId] = useState<string>();

  function handleConfirmQRCode(id: string) {
    setId(id);
    setStage('confirm');
  }

  async function handleConfirmCode(ok: boolean) {
    if (ok) {
      setStage('name');
    } else {
      setStage('scan');
    }
  }

  async function handleName(ok: boolean) {
    setOpen(!ok);
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      setStage('scan');
    }
    setOpen(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogTrigger asChild>
        <Button variant="outline">Register a Verification Code</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2 sm:max-w-[425px]">
        {stage === 'scan' ? (
          <ScanQRCode next={handleConfirmQRCode} />
        ) : stage === 'confirm' ? (
          <ConfirmCode id={id} next={handleConfirmCode} />
        ) : (
          <AppName id={id} next={handleName} />
        )}
      </DialogContent>
    </Dialog>
  );
};
