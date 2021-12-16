import axios from "axios";
import { useEffect, useState } from "react";

export interface TokenURIData {
	status: 'LOADING' | 'READY';
	image: string;
}

export const useTokenURI = (tokenURI: string): TokenURIData => {
	const [metadata, setMetadata] = useState(null);
	const [status, setStatus] = useState<'LOADING' | 'READY'>('LOADING');
	const [image, setImage] = useState(null);

	useEffect(() => {
		if (tokenURI !== null) {
			setTimeout(async () => {
				if (tokenURI.indexOf('ipfs://') === 0) {
					setMetadata((await axios.get(`https://ipfs.io/ipfs/${tokenURI.slice('ipfs://'.length)}`)).data);
				} else if (tokenURI.indexOf('http://') === 0 || tokenURI.indexOf('https://')) {
					setMetadata((await axios.get(tokenURI)).data);
				} else {
					setStatus('READY');
				}
			}, 0);
		}
	}, [tokenURI]);

	useEffect(() => {
		if (metadata !== null) {
			let url;
			if (!!metadata.image) {
				url = metadata.image;
			} else if (!!metadata.image_url) {
				url = metadata.image_url
			}

			if (url.indexOf('ipfs://') === 0 ) {
				setImage(`https://ipfs.io/ipfs/${url.slice('ipfs://'.length)}`)
			} else {
				setImage(url)
			}
			setStatus('READY');
		}
	}, [metadata]);

	return {
		status,
		image
	};
}