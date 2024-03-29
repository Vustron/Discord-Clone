'use client';

import * as z from 'zod';
import axios from 'axios';
import qs from 'query-string';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { formChannelSchema } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useModal } from '@/hooks/useModalStore';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { ChannelType } from '@prisma/client';
import { useEffect } from 'react';

export const CreateChannelModal = () => {
	// init use Modal
	const { isOpen, onClose, type, data } = useModal();
	const isModalOpen = isOpen && type === 'createChannel';
	const { channelType } = data;

	// init params
	const params = useParams();

	// init router
	const router = useRouter();

	// init form
	const form = useForm<z.infer<typeof formChannelSchema>>({
		resolver: zodResolver(formChannelSchema),
		defaultValues: {
			name: '',
			type: channelType || ChannelType.TEXT,
		},
	});

	//set default value to a specific channel type
	useEffect(() => {
		if (channelType) {
			form.setValue('type', channelType);
		} else {
			form.setValue('type', ChannelType.TEXT);
		}
	}, [channelType, form]);

	// init form state
	const isLoading = form.formState.isSubmitting;

	// submit function
	const onSubmit = async (values: z.infer<typeof formChannelSchema>) => {
		try {
			const url = qs.stringifyUrl({
				url: '/api/channels',
				query: {
					serverId: params?.serverId,
				},
			});

			await axios.post(url, values);

			form.reset();
			onClose();
			router.refresh();
			toast.success('Channel created successfully');
		} catch (error) {
			console.log(error);
			toast.error(`Channel creation error: ${error}`);
		}
	};

	// close modal
	const handleClose = () => {
		form.reset();
		onClose();
	};

	return (
		<Dialog open={isModalOpen} onOpenChange={handleClose}>
			<DialogContent className='bg-white text-black p-0 overflow-hidden'>
				<DialogHeader className='pt-8 px-6'>
					<DialogTitle className='text-2xl text-center font-bold'>
						Create Channel
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<div className='space-y-8 px-6'>
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='uppercase text-xs font-bold text-zinc-500'>
											Channel name
										</FormLabel>
										<FormControl>
											<Input
												disabled={isLoading}
												className='bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0'
												placeholder='Enter channel name'
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='type'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Channel Type</FormLabel>
										<Select
											disabled={isLoading}
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger className='bg-zinc-300/50 border-0 focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 capitalize outline-none'>
													<SelectValue placeholder='Select a channel type' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.values(ChannelType).map((type) => (
													<SelectItem
														key={type}
														value={type}
														className='capitalize'
													>
														{type.toLowerCase()}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className='bg-gray-100 px-6 py-4'>
							<Button variant='primary' disabled={isLoading}>
								Create
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
