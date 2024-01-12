import { UserButton } from '@clerk/nextjs';

export default function Home() {
	return (
		<div>
			<h1 className='text-3xl font-bold text-indigo-500'>
				<UserButton afterSignOutUrl='/' />
			</h1>
		</div>
	);
}
