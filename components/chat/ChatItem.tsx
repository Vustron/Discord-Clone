'use client';

import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { Member, Profile, MemberRole } from '@prisma/client';
import UserAvatar from '@/components/shared/UserAvatar';
import { useRouter, useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { formChatItemSchema } from '@/lib/validation';
import { Edit, FileIcon, Trash } from 'lucide-react';
import { useModal } from '@/hooks/useModalStore';
import { roleIconMap } from '@/constants/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import qs from 'query-string';
import axios from 'axios';
import * as z from 'zod';

interface ChatItemProps {
	id: string;
	content: string;
	member: Member & {
		profile: Profile;
	};
	timestamp: string;
	fileUrl: string | null;
	deleted: boolean;
	currentMember: Member;
	isUpdated: boolean;
	socketUrl: string;
	socketQuery: Record<string, string>;
}

const ChatItem = ({
	id,
	content,
	member,
	timestamp,
	fileUrl,
	deleted,
	currentMember,
	isUpdated,
	socketUrl,
	socketQuery,
}: ChatItemProps) => {
	// init params
	const params = useParams();

	// init router
	const router = useRouter();

	// init modal
	const { onOpen } = useModal();

	// init edit and delete state
	const [isEditing, setIsEditing] = useState(false);

	// init file type
	const fileType = fileUrl?.split('.').pop();

	// init roles
	const isAdmin = currentMember.role === MemberRole.ADMIN;
	const isModerator = currentMember.role === MemberRole.MODERATOR;
	const isOwner = currentMember.id === member.id;

	// init edit and delete function
	const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
	const canEditMessage = !deleted && isOwner && !fileUrl;

	// identify file type
	const isPDF = fileType === 'pdf' && fileUrl;
	const isImage = !isPDF && fileUrl;

	// init form
	const form = useForm<z.infer<typeof formChatItemSchema>>({
		resolver: zodResolver(formChatItemSchema),
		defaultValues: {
			content: content,
		},
	});

	useEffect(() => {
		form.reset({
			content: content,
		});
	}, [content, form]);

	// submit function
	const onSubmit = async (values: z.infer<typeof formChatItemSchema>) => {
		try {
			const url = qs.stringifyUrl({
				url: `${socketUrl}/${id}`,
				query: socketQuery,
			});

			await axios.patch(url, values);

			form.reset();
			setIsEditing(false);
		} catch (error) {
			console.log(error);
		}
	};

	// init loading state
	const isLoading = form.formState.isSubmitting;

	// escape key function
	useEffect(() => {
		const handleKeyDown = (event: any) => {
			if (event.key === 'Escape' || event.keyCode === 27) {
				setIsEditing(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	// redirect to direct message on click
	const onMemberClick = () => {
		if (member.id === currentMember.id) {
			return;
		}

		router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
	};

	return (
		<div
			className='relative group flex items-center hover:bg-black/5
        p-4 transition w-full'
		>
			<div className='group flex gap-x-2 items-start w-full'>
				<div
					onClick={onMemberClick}
					className='cursor-pointer hover:drop-shadow-md transition'
				>
					<UserAvatar src={member.profile.imageUrl} />
				</div>

				<div className='flex flex-col w-full'>
					<div className='flex items-center gap-x-2'>
						<div className='flex items-center'>
							<p
								onClick={onMemberClick}
								className='font-semibold text-sm hover:underline cursor-pointer'
							>
								{member.profile.name}
							</p>
							<ActionTooltip label={member.role}>
								{roleIconMap[member.role]}
							</ActionTooltip>
						</div>

						<span
							className='text-xs text-zinc-500
                        dark:text-zinc-400'
						>
							{timestamp}
						</span>
					</div>

					{isImage && (
						<a
							href={fileUrl}
							target='_blank'
							rel='noopener noreferrer'
							className='relative aspect-square rounded-md mt-2
                        overflow-hidden border flex items-center bg-secondary
                        h-48 w-48'
						>
							<Image
								src={fileUrl}
								alt={content}
								fill
								className='object-cover'
								priority
							/>
						</a>
					)}

					{isPDF && (
						<div
							className='relative flex items-center p-2 mt-2 rounded-md
			bg-background/10'
						>
							<FileIcon className='h-10 w-10 fill-indigo-200 stroke-indigo-400' />
							<a
								href={fileUrl}
								target='_blank'
								rel='noopener noreferrer'
								className='ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline'
							>
								PDF file
							</a>
						</div>
					)}

					{!fileUrl && !isEditing && (
						<p
							className={cn(
								'text-sm text-zinc-600 dark:text-zinc-300',
								deleted &&
									'italic text-zinc-500 dark:text-zinc-400 text-xs mt-1'
							)}
						>
							{content}

							{isUpdated && !deleted && (
								<span
									className='text-[10px] mx-2 text-zinc-500
                                dark:text-zinc-400'
								>
									(edited)
								</span>
							)}
						</p>
					)}

					{!fileUrl && isEditing && (
						<Form {...form}>
							<form
								className='flex items-center w-full gap-x-2 pt-2'
								onSubmit={form.handleSubmit(onSubmit)}
							>
								<FormField
									control={form.control}
									name='content'
									render={({ field }) => (
										<FormItem className='flex-1'>
											<FormControl>
												<div className='relative w-full'>
													<Input
														disabled={isLoading}
														className='p-2 bg-zinc-200/90 dark:bg-zinc-700/75
                                                            border-0 focus-visible:ring-0 focus-visible:ring-offset-0
                                                            text-zinc-600 dark:text-zinc-200'
														placeholder='Edited Message'
														{...field}
													/>
												</div>
											</FormControl>
										</FormItem>
									)}
								/>

								<Button size='sm' variant='primary'>
									Save
								</Button>
							</form>

							<span className='text-[10px] mt-1 text-zinc-400'>
								Press escape to cancel, enter to save
							</span>
						</Form>
					)}
				</div>
			</div>

			{canDeleteMessage && (
				<div
					className='hidden group-hover:flex items-center
                gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800
                border rounded-sm'
				>
					{canEditMessage && (
						<ActionTooltip label='Edit'>
							<Edit
								onClick={() => setIsEditing(true)}
								className='cursor-pointer ml-auto w-4 h-4 text-zinc-500
                            hover:text-yellow-300 transition'
							/>
						</ActionTooltip>
					)}

					{canDeleteMessage && (
						<ActionTooltip label='Delete'>
							<Trash
								onClick={() =>
									onOpen('deleteMessage', {
										apiUrl: `${socketUrl}/${id}`,
										query: socketQuery,
									})
								}
								className='cursor-pointer ml-auto w-4 h-4 text-zinc-500
                            hover:text-red-600 transition'
							/>
						</ActionTooltip>
					)}
				</div>
			)}
		</div>
	);
};

export default ChatItem;
