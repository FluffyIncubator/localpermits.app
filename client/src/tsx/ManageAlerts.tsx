import React, { useContext, useEffect, useRef, useState } from 'react';
import { ApiContext } from './ApiContext';
import Modal from './Modal';

export default function ManageAlerts() {
	const [isCheckingAddress, setIsCheckingAddress] = useState(false);

	const addressRef = useRef<HTMLInputElement>(null);

	const apiContext = useContext(ApiContext);

	const saveAddress = async () => {
		if (!addressRef.current || !addressRef.current.value) return;

		setIsCheckingAddress(true);
		let result = await apiContext.setAddress(addressRef.current.value);
		if (result == "") alert("There was an error saving your address in the system. Please try again later.");
		addressRef.current.value = result;
		setIsCheckingAddress(false);
	}

	useEffect(() => {
		if (apiContext.sessionId && addressRef.current) {
			apiContext.getAddress().then(address => {
				if (addressRef.current) {
					addressRef.current.value = address
				}
			});
		}
	})

	return (
		<>
			<div className='manage-alerts'>
				<p>Enter your address below and you will receive text messages for any new demolition related permits issued within approximately 1/2 mile of it.</p>
				<input ref={addressRef} type="text" className='input' placeholder='1234 Market St, Philadelphia PA 19107' disabled={isCheckingAddress} />
				<br /><br />
				<button className='button' disabled={isCheckingAddress} onClick={saveAddress}>Save</button>
			</div>
			<Modal title='Checking address...' isOpen={isCheckingAddress}></Modal>
		</>
	)
}