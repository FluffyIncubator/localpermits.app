import React, { useContext, useEffect, useRef, useState } from 'react';
import { ApiContext } from './ApiContext';
import ManageAlerts from './ManageAlerts';
import Modal from './Modal';

const STAGE_REQUEST_CODE = 0;
const STAGE_ENTER_CODE = 1;
const STAGE_VERIFY_CODE = 2;
const STAGE_SIGNED_IN = 3;

export default function Menu() {
	const apiContext = useContext(ApiContext);

	const initialLoadRef = useRef(true);
	const phoneNumberRef = useRef<HTMLInputElement>(null);
	const codeRef = useRef<HTMLInputElement>(null);

	const [stage, setStage] = useState(STAGE_REQUEST_CODE);
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isManageAlertsOpen, setIsManageAlertsOpen] = useState(false);

	useEffect(() => {
		if (initialLoadRef.current) {
			initialLoadRef.current = false;

			if (apiContext.sessionId) {
				apiContext.getPhoneNumber().then(phoneNumber => {
					setPhoneNumber(phoneNumber);
					setStage(STAGE_SIGNED_IN);
				});
				apiContext.getCoords().then(coords => {
					console.log("Received coords:" + coords.join(' x '));
				})
			}
		}
	})

	const getCode = async () => {
		setIsLoading(true);

		if (phoneNumberRef.current) {
			let phoneNumber = phoneNumberRef.current.value.replace(/[^0-9]*/ig, '');

			if (phoneNumber.length !== 10) {
				alert("Please provide a phone number that is 10 digits. It must be a US mobile number that can receive text messages.");
				setIsLoading(false);
				return;
			}

			setPhoneNumber(phoneNumber);

			let result = await apiContext.requestCode(phoneNumber);
			if (result) {
				setStage(STAGE_ENTER_CODE);
			} else {
				alert('There was a problem requesting a code. Please try again later.');
			}
		}

		setIsLoading(false);
	}

	const checkCode = async () => {
		if (!codeRef.current) return;

		setIsLoading(true);

		setStage(STAGE_VERIFY_CODE);

		let code = codeRef.current.value.replace(/[^0-9]*/ig, '');
		if (code.length !== 6) {
			alert('That is not a valid code');
			setStage(STAGE_ENTER_CODE);
			setIsLoading(false);
			return;
		}

		let result = await apiContext.checkCode(code);
		if (result) {
			setStage(STAGE_SIGNED_IN);
			setIsLoading(false);
			return;
		}

		alert("Something went wrong. Please try again in a little while.");
		setStage(STAGE_REQUEST_CODE);
		setIsLoading(false);
	}

	const startOver = () => {
		apiContext.logOut();
		setPhoneNumber('');
		setStage(STAGE_REQUEST_CODE);
		setIsLoading(false);
	}

	const manageAlerts = () => {
		setIsManageAlertsOpen(true);
	}

	const signOut = () => {
		if (confirm("Are you sure you want to sign out?")) {
			startOver();
		}
	}

	return (
		<>
			<button className='button' onClick={() => setIsModalOpen(true)}>{apiContext.phoneNumber ? apiContext.phoneNumber : 'Sign In'}</button>
			<Modal title='My Account' isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
				<>
					{stage == STAGE_REQUEST_CODE &&
						<>
							<p>If you sign in with a mobile number you can set an alert to be texted when a new permit for demolition appears within a half mile of your home.</p>
							<p>Obviously, texting fees may apply!</p>
							<div className='sign-in-form'>
								<input ref={phoneNumberRef} type='tel' className='input' placeholder='Mobile number' disabled={isLoading} />
								<button className='button' onClick={getCode} disabled={isLoading}>Send Code</button>
							</div>
						</>}
				</>
				<>
					{stage == STAGE_ENTER_CODE &&
						<>
							<p>We are texting a code to <strong>{phoneNumber}</strong>. Enter it below to sign in.</p>
							<p>Codes expire after 5 minutes and cannot be reused.</p>
							<div className='sign-in-form'>
								<input ref={codeRef} type='number' className='input' placeholder='Enter code' disabled={isLoading} />
								<button className='button' disabled={isLoading} onClick={checkCode}>Verify</button>
							</div>
							<br />
							<br />
							<button className='button' onClick={startOver}>Start Over</button>
						</>}
				</>
				<>
					{stage == STAGE_VERIFY_CODE &&
						<>
							<p>Verifying code...</p>
						</>}
				</>
				<>
					{stage == STAGE_SIGNED_IN &&
						<>
							<p>You are signed in as <strong>{phoneNumber}</strong></p>
							<br />
							<div className='buttons'>
								<button className='button' onClick={manageAlerts}>Manage Alerts</button>
								<button className='button' onClick={signOut}>Sign out</button>
							</div>
						</>}
				</>
			</Modal>
			<Modal title='Manage alerts' isOpen={isManageAlertsOpen} onClose={() => setIsManageAlertsOpen(false)}>
				<ManageAlerts></ManageAlerts>
			</Modal>
		</>
	)
}