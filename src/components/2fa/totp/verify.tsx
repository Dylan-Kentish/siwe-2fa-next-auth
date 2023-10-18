'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { list } from '@/actions/totp';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTOTP } from '@/hooks/use-totp';

const formSchema = z.object({
  id: z.string().min(1, { message: 'Please select a verification method' }),
  code: z
    .string()
    .refine(code => code.length === 6, {
      message: 'Verification code must be exactly 6 digits long',
    })
    .refine(code => /^\d+$/.test(code), {
      message: 'Verification code must consist of digits only',
    }),
});

type Props = {
  className?: string;
  onVerified: (valid: boolean) => void;
};

type App = {
  id: string;
  name: string;
};

export const Verify: React.FC<Props> = ({ className, onVerified }) => {
  const [apps, setApps] = useState<App[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      code: '',
    },
  });
  const { verifyAsync } = useTOTP();

  function handleSubmit(data: z.infer<typeof formSchema>) {
    verifyAsync(data.id, data.code).then(onVerified);
  }

  useEffect(() => {
    list().then(setApps);
  }, []);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" className={className} disabled={!apps.length}>
          Verification Code
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>2FA Verification</AlertDialogTitle>
          <AlertDialogDescription>
            Select an verification method and enter the code from your authenticator app.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verification method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {apps.map(app => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This is a authenticator app that you have previously set up.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <AlertDialogFooter>
              <Button type="submit">Confirm</Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
