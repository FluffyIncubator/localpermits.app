import React from 'react';
import { Api } from './Api';
import { ApiContext } from './ApiContext';
import Map from './Map';
import Nav from './Nav';

export default function Main() {
	return (
		<div className='main'>
			<ApiContext.Provider value={new Api()}>
				<Nav></Nav>
				<Map></Map>
			</ApiContext.Provider>
		</div>
	)
}