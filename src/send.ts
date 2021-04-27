import { HttpResponse } from '@aws-sdk/protocol-http';
import { args } from './args';
import { logError } from './log';

const {
    STSClient,
    AssumeRoleCommand
} = require('@aws-sdk/client-sts');

const { HttpRequest } = require('@aws-sdk/protocol-http');
const { NodeHttpHandler } = require('@aws-sdk/node-http-handler');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { Sha256 } = require('@aws-crypto/sha256-js');

const ELK_AWS_SERVICE = 'es';
const ELK_DOC_TYPE = '_doc';
const ELK_ROLE_SESSION_NAME = 'session1';
const REGION = 'eu-west-1';

const sts = new STSClient({ region: REGION });

interface RoleCredentials {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
}

/**
 * Creates the body to be included in the request for sending the logs using the _bulk API.
 * @param logs The logs to be formatted in the body.
 */
function createBody(logs: Record<string, unknown>[]): string {
    const result = [];
    for (const log of logs) {
        result.push(JSON.stringify({ 'index': {} }));
        result.push(JSON.stringify(log));
    }
    return result.join('\n') + '\n';
}

/** Prepares the request to be signed.
 *
 * @param elkDomain The ELK domain.
 * @param elkIndex The index in which we want to write the logs.
 * @param logs The logs to write.
 */
function prepareRequest(elkDomain: string, elkIndex: string, logs: Record<string, unknown>[]): typeof HttpRequest {
    const body = createBody(logs);
    const domainToUse = elkDomain.replace('https://', '').replace('http://','');
    return new HttpRequest({
        port: '443',
        hostname: domainToUse,
        method: 'POST',
        path: `${elkIndex}/${ELK_DOC_TYPE}/_bulk`,
        body,
        headers: {
            'host': domainToUse,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body).toString()
        }
    });
}

/**
 * Assumes an AWS role for sending the requests.
 * @param elkRole The AWS role to assume.
 * @param elkRoleSessionName The AWS role session name to assume.
 * @param elkRegion The AWS region the ELK is located in.
 */
async function assumeRole(elkRole: string): Promise<RoleCredentials> {
    const roleToAssume = {
        RoleArn: elkRole,
        RoleSessionName: ELK_ROLE_SESSION_NAME,
        DurationSeconds: 900,
    };
    const { Credentials: roleCredentials } = await sts.send(new AssumeRoleCommand(roleToAssume));
    return roleCredentials;
}

/**
 * Presigns the request against AWS's API.
 * @param roleCredentials The role credentials to assume for the request.
 * @param elkRegion The AWS region where the ELK node is located.
 * @param request The request to be signed.
 */
async function presignRequest(roleCredentials: RoleCredentials,
                              request: typeof HttpRequest) {
    const signer = new SignatureV4({
        credentials: {
            accessKeyId: roleCredentials.AccessKeyId,
            secretAccessKey: roleCredentials.SecretAccessKey,
            sessionToken: roleCredentials.SessionToken
        },
        region: REGION,
        service: ELK_AWS_SERVICE,
        sha256: Sha256
    });

    const client = new NodeHttpHandler();
    const preSignedReq = await signer.sign(request);
    return { client, preSignedReq };
}

/**
 * Handles the response from the signed POST _bulk query.
 * @param res The response of the query.
 */
function handleLogsPostResponse(res: { response: HttpResponse }) {
    const responseCode = res.response.statusCode;
    let responseLog = '';

    res.response.body.on('readable', function () {
        responseLog += res.response.body.read();
    });
    res.response.body.on('end', function () {
        if (responseCode !== 200 && responseCode !== 201) {
            logError('Error while sending logs', responseLog);
        }
    });
}

/** Sends the logs through a signed request.
 * @param logs The logs to be sent.
 */
export function send(logs: Record<string, unknown>[]) {
    const {
        elkRole,
        elkDomain,
        elkIndex,
    } = args;
    assumeRole(elkRole).then(
        async roleCredentials => {
            const request = prepareRequest(elkDomain, elkIndex, logs);
            const { client, preSignedReq } = await presignRequest(roleCredentials, request);
            const res: { response: HttpResponse } = await client.handle(preSignedReq);
            handleLogsPostResponse(res);
        }
    ).catch(
        err => logError(err)
    );
}
