import React, { ReactElement, useEffect, useState } from 'react';

interface ModalProps {
	title: string;
	children?: ReactElement | ReactElement[];
	isOpen?: boolean;
	onClose?: () => void;
}

export default function Modal(props: ModalProps) {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (typeof props.isOpen !== 'undefined') setIsOpen(props.isOpen);
	}, [props]);

	return (
		<>
			{isOpen &&
				<div className='modal'>
					<div className='modal-window'>
						<header className='modal-head'>
							<h2 className='title is-size-5'>{props.title}</h2>
							{props.onClose &&
								<button className='button is-size-7' onClick={props.onClose}>close</button>}
						</header>
						<div className='modal-body'>
							{props.children}
						</div>
					</div>
				</div>}
		</>
	)
}