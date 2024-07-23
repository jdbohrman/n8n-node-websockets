import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeApiError,
    NodeOperationError,
    ICredentialDataDecryptedObject,
		sleep,
} from 'n8n-workflow';
import { io, Socket } from "socket.io-client";

export class WebsocketsNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Websockets Node',
        name: 'websocketsNode',
        group: ['trigger'],
        version: 1,
        description: 'Basic Websockets Node using Socket.io',
        defaults: {
            name: 'Websockets Node',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'websocketsCredentialsApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Websocket URL',
                name: 'websocketUrl',
                type: 'string',
                default: '',
                placeholder: 'ws://example.com/my-namespace',
                description: 'The URL of the websocket server to connect to',
            },
            {
                displayName: 'Event Name',
                name: 'eventName',
                type: 'string',
                default: '',
                description: 'The name of the event to listen for',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const credentials = await this.getCredentials('websocketsCredentialsApi') as ICredentialDataDecryptedObject;

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const websocketUrl = this.getNodeParameter('websocketUrl', itemIndex, '') as string;
                const eventName = this.getNodeParameter('eventName', itemIndex, '') as string;

                const socket: Socket = io(websocketUrl, {
                    reconnectionDelayMax: 10000,
                    auth: {
                        token: credentials.authToken as string,
                    },
                });

                // Connect to the WebSocket server
                socket.connect();

                // Listen for the specified event
                socket.on(eventName, (data) => {
                    returnData.push({ json: { event: eventName, data } });
                });

								// Handle connection errors
								socket.on('connect_error', (error) => {
									const errorData = {
											message: 'WebSocket connection error',
											description: error.message,
									};
									throw new NodeApiError(this.getNode(), errorData);
								});

                // Wait for a short time to allow for connection and initial data receipt
                await new Promise(resolve => sleep(1000));

                // Disconnect after processing
                socket.disconnect();

            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message }, pairedItem: itemIndex });
                } else {
                    if (error.name === 'NodeApiError') {
                        throw error;
                    } else {
                        throw new NodeOperationError(this.getNode(), `Execution error: ${error.message}`, { itemIndex });
                    }
                }
            }
        }

        return this.prepareOutputData(returnData);
    }
}
