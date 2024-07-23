import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WebsocketsCredentialsApi implements ICredentialType {
	name = 'websocketsCredentialsApi';
	displayName = 'Websockets Credentials API';
	properties: INodeProperties[] = [
			{
					displayName: 'Authentication Token',
					name: 'authToken',
					type: 'string',
					typeOptions: {
							password: true,
					},
					default: '',
			},
	];
}
