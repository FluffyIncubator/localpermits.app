import React from 'react';
import Menu from './Menu';

export default function Nav() {
	return (
		<div id="nav">
			<h1 className='title has-text-light'>LocalPermits.app</h1>
			<p className='subtitle has-text-light'>Get the lead out Philly!</p>
			<div className='buttons'>
				<Menu></Menu>
			</div>
		</div>
	)
}