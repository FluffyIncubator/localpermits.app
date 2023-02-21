import React, { useRef, useState } from 'react';
import Modal from './Modal';

export default function ManageAlerts() {
	const [isCheckingAddress, setIsCheckingAddress] = useState(false);

	const addressRef = useRef<HTMLInputElement>(null);

	const saveAddress = async () => {
		setIsCheckingAddress(true);

		setIsCheckingAddress(false);
	}

	return (
		<>
			<div className='manage-alerts'>
				<p>Enter your address below and you will receive text messages for any new demolition related permits issued within approximately 1/2 mile of it.</p>
				<input ref={addressRef} type="text" className='input' placeholder='1234 Market St, Philadelphia PA 19103' disabled={isCheckingAddress} />
				<br /><br />
				<button className='button' disabled={isCheckingAddress} onClick={saveAddress}>Save</button>
			</div>
			<Modal title='Checking address...' isOpen={isCheckingAddress}></Modal>
		</>
	)
}