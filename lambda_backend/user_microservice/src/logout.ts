import { Handler } from 'aws-lambda';
import CognitoIdentity, {
  GlobalSignOutRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { LogoutEvent, getMiddlewareAddedHandler } from './common';
import createError from 'http-errors';

const cognitoIdentity = new CognitoIdentity();

const logout: Handler = async (event: LogoutEvent) => {
  if (!process.env['COGNITO_CLIENT_ID']) {
    throw createError(400, 'Cognito Client ID is not set');
  }
  const {
    headers: { Authorization },
  } = event;
  const globalSignOutRequest: GlobalSignOutRequest = {
    AccessToken: Authorization.split(' ')[1],
  };
  try {
    await cognitoIdentity.globalSignOut(globalSignOutRequest).promise();
  } catch (error) {
    throw createError(400, 'Error occurred during sign out in Cognito: ' + error.stack);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ Message: 'Sign out success' }),
  };
};

export const handler = getMiddlewareAddedHandler(logout);
