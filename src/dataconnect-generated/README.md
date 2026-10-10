# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `default`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMe*](#getme)
  - [*ListBloodBanks*](#listbloodbanks)
  - [*GetBloodBank*](#getbloodbank)
  - [*GetActiveDonorStats*](#getactivedonorstats)
  - [*GetEmergencyRequest*](#getemergencyrequest)
  - [*ListMyRequests*](#listmyrequests)
  - [*ListDonorFeed*](#listdonorfeed)
  - [*ListTriageQueue*](#listtriagequeue)
  - [*ListDonorCommitments*](#listdonorcommitments)
  - [*ListDonorResponses*](#listdonorresponses)
  - [*GetDonorAvailability*](#getdonoravailability)
  - [*SearchDonorDirectory*](#searchdonordirectory)
  - [*GetHospitalInventory*](#gethospitalinventory)
  - [*GetRequestCandidates*](#getrequestcandidates)
  - [*GetRequestWorkflow*](#getrequestworkflow)
  - [*GetDonorCommitment*](#getdonorcommitment)
  - [*ListAlerts*](#listalerts)
  - [*GetDashboardSummary*](#getdashboardsummary)
- [**Mutations**](#mutations)
  - [*CreateEmergencyRequest*](#createemergencyrequest)
  - [*CreateEmergencyRequestAsUser*](#createemergencyrequestasuser)
  - [*UpdateRequestStatus*](#updaterequeststatus)
  - [*RegisterUser*](#registeruser)
  - [*UpdateDonorProfile*](#updatedonorprofile)
  - [*UpdateRecipientDistrict*](#updaterecipientdistrict)
  - [*RespondToRequest*](#respondtorequest)
  - [*UpdateDonorResponse*](#updatedonorresponse)
  - [*DeleteDonorResponse*](#deletedonorresponse)
  - [*SetDonorAvailability*](#setdonoravailability)
  - [*DeleteDonorAvailability*](#deletedonoravailability)
  - [*StartDonorTransit*](#startdonortransit)
  - [*CreateDonorCheckInTicket*](#createdonorcheckinticket)
  - [*VerifyDonorCheckIn*](#verifydonorcheckin)
  - [*SubmitScreening*](#submitscreening)
  - [*StartExtraction*](#startextraction)
  - [*CompleteExtraction*](#completeextraction)
  - [*CompleteDonationCase*](#completedonationcase)
  - [*UpdateInventoryItem*](#updateinventoryitem)
  - [*UpdatePushToken*](#updatepushtoken)
  - [*MarkAlertsRead*](#markalertsread)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `default`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMe
You can execute the `GetMe` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMe(options?: ExecuteQueryOptions): QueryPromise<GetMeData, undefined>;

interface GetMeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMeData, undefined>;
}
export const getMeRef: GetMeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMe(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMeData, undefined>;

interface GetMeRef {
  ...
  (dc: DataConnect): QueryRef<GetMeData, undefined>;
}
export const getMeRef: GetMeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMeRef:
```typescript
const name = getMeRef.operationName;
console.log(name);
```

### Variables
The `GetMe` query has no variables.
### Return Type
Recall that executing the `GetMe` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMeData {
  me?: {
    uid: string;
    role: UserRole;
    fullName: string;
    email?: string | null;
    mobile?: string | null;
    district?: string | null;
    bloodGroup?: string | null;
    isVerified: boolean;
  } & User_Key;
}
```
### Using `GetMe`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMe } from '@dataconnect/generated';


// Call the `getMe()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMe();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMe(dataConnect);

console.log(data.me);

// Or, you can use the `Promise` API.
getMe().then((response) => {
  const data = response.data;
  console.log(data.me);
});
```

### Using `GetMe`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMeRef } from '@dataconnect/generated';


// Call the `getMeRef()` function to get a reference to the query.
const ref = getMeRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMeRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.me);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.me);
});
```

## ListBloodBanks
You can execute the `ListBloodBanks` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listBloodBanks(options?: ExecuteQueryOptions): QueryPromise<ListBloodBanksData, undefined>;

interface ListBloodBanksRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListBloodBanksData, undefined>;
}
export const listBloodBanksRef: ListBloodBanksRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBloodBanks(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListBloodBanksData, undefined>;

interface ListBloodBanksRef {
  ...
  (dc: DataConnect): QueryRef<ListBloodBanksData, undefined>;
}
export const listBloodBanksRef: ListBloodBanksRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBloodBanksRef:
```typescript
const name = listBloodBanksRef.operationName;
console.log(name);
```

### Variables
The `ListBloodBanks` query has no variables.
### Return Type
Recall that executing the `ListBloodBanks` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBloodBanksData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListBloodBanksData {
  banks?: unknown[] | null;
}
```
### Using `ListBloodBanks`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBloodBanks } from '@dataconnect/generated';


// Call the `listBloodBanks()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBloodBanks();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBloodBanks(dataConnect);

console.log(data.banks);

// Or, you can use the `Promise` API.
listBloodBanks().then((response) => {
  const data = response.data;
  console.log(data.banks);
});
```

### Using `ListBloodBanks`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBloodBanksRef } from '@dataconnect/generated';


// Call the `listBloodBanksRef()` function to get a reference to the query.
const ref = listBloodBanksRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBloodBanksRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.banks);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.banks);
});
```

## GetBloodBank
You can execute the `GetBloodBank` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBloodBank(vars: GetBloodBankVariables, options?: ExecuteQueryOptions): QueryPromise<GetBloodBankData, GetBloodBankVariables>;

interface GetBloodBankRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBloodBankVariables): QueryRef<GetBloodBankData, GetBloodBankVariables>;
}
export const getBloodBankRef: GetBloodBankRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBloodBank(dc: DataConnect, vars: GetBloodBankVariables, options?: ExecuteQueryOptions): QueryPromise<GetBloodBankData, GetBloodBankVariables>;

interface GetBloodBankRef {
  ...
  (dc: DataConnect, vars: GetBloodBankVariables): QueryRef<GetBloodBankData, GetBloodBankVariables>;
}
export const getBloodBankRef: GetBloodBankRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBloodBankRef:
```typescript
const name = getBloodBankRef.operationName;
console.log(name);
```

### Variables
The `GetBloodBank` query requires an argument of type `GetBloodBankVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBloodBankVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetBloodBank` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBloodBankData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetBloodBankData {
  bank?: unknown | null;
}
```
### Using `GetBloodBank`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBloodBank, GetBloodBankVariables } from '@dataconnect/generated';

// The `GetBloodBank` query requires an argument of type `GetBloodBankVariables`:
const getBloodBankVars: GetBloodBankVariables = {
  id: ..., 
};

// Call the `getBloodBank()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBloodBank(getBloodBankVars);
// Variables can be defined inline as well.
const { data } = await getBloodBank({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBloodBank(dataConnect, getBloodBankVars);

console.log(data.bank);

// Or, you can use the `Promise` API.
getBloodBank(getBloodBankVars).then((response) => {
  const data = response.data;
  console.log(data.bank);
});
```

### Using `GetBloodBank`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBloodBankRef, GetBloodBankVariables } from '@dataconnect/generated';

// The `GetBloodBank` query requires an argument of type `GetBloodBankVariables`:
const getBloodBankVars: GetBloodBankVariables = {
  id: ..., 
};

// Call the `getBloodBankRef()` function to get a reference to the query.
const ref = getBloodBankRef(getBloodBankVars);
// Variables can be defined inline as well.
const ref = getBloodBankRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBloodBankRef(dataConnect, getBloodBankVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.bank);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.bank);
});
```

## GetActiveDonorStats
You can execute the `GetActiveDonorStats` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getActiveDonorStats(options?: ExecuteQueryOptions): QueryPromise<GetActiveDonorStatsData, undefined>;

interface GetActiveDonorStatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetActiveDonorStatsData, undefined>;
}
export const getActiveDonorStatsRef: GetActiveDonorStatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getActiveDonorStats(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetActiveDonorStatsData, undefined>;

interface GetActiveDonorStatsRef {
  ...
  (dc: DataConnect): QueryRef<GetActiveDonorStatsData, undefined>;
}
export const getActiveDonorStatsRef: GetActiveDonorStatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getActiveDonorStatsRef:
```typescript
const name = getActiveDonorStatsRef.operationName;
console.log(name);
```

### Variables
The `GetActiveDonorStats` query has no variables.
### Return Type
Recall that executing the `GetActiveDonorStats` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetActiveDonorStatsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetActiveDonorStatsData {
  donors?: unknown[] | null;
}
```
### Using `GetActiveDonorStats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getActiveDonorStats } from '@dataconnect/generated';


// Call the `getActiveDonorStats()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getActiveDonorStats();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getActiveDonorStats(dataConnect);

console.log(data.donors);

// Or, you can use the `Promise` API.
getActiveDonorStats().then((response) => {
  const data = response.data;
  console.log(data.donors);
});
```

### Using `GetActiveDonorStats`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getActiveDonorStatsRef } from '@dataconnect/generated';


// Call the `getActiveDonorStatsRef()` function to get a reference to the query.
const ref = getActiveDonorStatsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getActiveDonorStatsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.donors);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.donors);
});
```

## GetEmergencyRequest
You can execute the `GetEmergencyRequest` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getEmergencyRequest(vars: GetEmergencyRequestVariables, options?: ExecuteQueryOptions): QueryPromise<GetEmergencyRequestData, GetEmergencyRequestVariables>;

interface GetEmergencyRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEmergencyRequestVariables): QueryRef<GetEmergencyRequestData, GetEmergencyRequestVariables>;
}
export const getEmergencyRequestRef: GetEmergencyRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getEmergencyRequest(dc: DataConnect, vars: GetEmergencyRequestVariables, options?: ExecuteQueryOptions): QueryPromise<GetEmergencyRequestData, GetEmergencyRequestVariables>;

interface GetEmergencyRequestRef {
  ...
  (dc: DataConnect, vars: GetEmergencyRequestVariables): QueryRef<GetEmergencyRequestData, GetEmergencyRequestVariables>;
}
export const getEmergencyRequestRef: GetEmergencyRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getEmergencyRequestRef:
```typescript
const name = getEmergencyRequestRef.operationName;
console.log(name);
```

### Variables
The `GetEmergencyRequest` query requires an argument of type `GetEmergencyRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetEmergencyRequestVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetEmergencyRequest` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetEmergencyRequestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetEmergencyRequestData {
  request?: unknown | null;
}
```
### Using `GetEmergencyRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getEmergencyRequest, GetEmergencyRequestVariables } from '@dataconnect/generated';

// The `GetEmergencyRequest` query requires an argument of type `GetEmergencyRequestVariables`:
const getEmergencyRequestVars: GetEmergencyRequestVariables = {
  id: ..., 
};

// Call the `getEmergencyRequest()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getEmergencyRequest(getEmergencyRequestVars);
// Variables can be defined inline as well.
const { data } = await getEmergencyRequest({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getEmergencyRequest(dataConnect, getEmergencyRequestVars);

console.log(data.request);

// Or, you can use the `Promise` API.
getEmergencyRequest(getEmergencyRequestVars).then((response) => {
  const data = response.data;
  console.log(data.request);
});
```

### Using `GetEmergencyRequest`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getEmergencyRequestRef, GetEmergencyRequestVariables } from '@dataconnect/generated';

// The `GetEmergencyRequest` query requires an argument of type `GetEmergencyRequestVariables`:
const getEmergencyRequestVars: GetEmergencyRequestVariables = {
  id: ..., 
};

// Call the `getEmergencyRequestRef()` function to get a reference to the query.
const ref = getEmergencyRequestRef(getEmergencyRequestVars);
// Variables can be defined inline as well.
const ref = getEmergencyRequestRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getEmergencyRequestRef(dataConnect, getEmergencyRequestVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.request);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.request);
});
```

## ListMyRequests
You can execute the `ListMyRequests` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyRequests(options?: ExecuteQueryOptions): QueryPromise<ListMyRequestsData, undefined>;

interface ListMyRequestsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyRequestsData, undefined>;
}
export const listMyRequestsRef: ListMyRequestsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyRequests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyRequestsData, undefined>;

interface ListMyRequestsRef {
  ...
  (dc: DataConnect): QueryRef<ListMyRequestsData, undefined>;
}
export const listMyRequestsRef: ListMyRequestsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyRequestsRef:
```typescript
const name = listMyRequestsRef.operationName;
console.log(name);
```

### Variables
The `ListMyRequests` query has no variables.
### Return Type
Recall that executing the `ListMyRequests` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyRequestsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyRequestsData {
  requests?: unknown[] | null;
}
```
### Using `ListMyRequests`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyRequests } from '@dataconnect/generated';


// Call the `listMyRequests()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyRequests();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyRequests(dataConnect);

console.log(data.requests);

// Or, you can use the `Promise` API.
listMyRequests().then((response) => {
  const data = response.data;
  console.log(data.requests);
});
```

### Using `ListMyRequests`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyRequestsRef } from '@dataconnect/generated';


// Call the `listMyRequestsRef()` function to get a reference to the query.
const ref = listMyRequestsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyRequestsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.requests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.requests);
});
```

## ListDonorFeed
You can execute the `ListDonorFeed` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listDonorFeed(options?: ExecuteQueryOptions): QueryPromise<ListDonorFeedData, undefined>;

interface ListDonorFeedRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDonorFeedData, undefined>;
}
export const listDonorFeedRef: ListDonorFeedRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDonorFeed(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDonorFeedData, undefined>;

interface ListDonorFeedRef {
  ...
  (dc: DataConnect): QueryRef<ListDonorFeedData, undefined>;
}
export const listDonorFeedRef: ListDonorFeedRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDonorFeedRef:
```typescript
const name = listDonorFeedRef.operationName;
console.log(name);
```

### Variables
The `ListDonorFeed` query has no variables.
### Return Type
Recall that executing the `ListDonorFeed` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDonorFeedData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListDonorFeedData {
  requests?: unknown[] | null;
}
```
### Using `ListDonorFeed`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDonorFeed } from '@dataconnect/generated';


// Call the `listDonorFeed()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDonorFeed();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDonorFeed(dataConnect);

console.log(data.requests);

// Or, you can use the `Promise` API.
listDonorFeed().then((response) => {
  const data = response.data;
  console.log(data.requests);
});
```

### Using `ListDonorFeed`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDonorFeedRef } from '@dataconnect/generated';


// Call the `listDonorFeedRef()` function to get a reference to the query.
const ref = listDonorFeedRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDonorFeedRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.requests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.requests);
});
```

## ListTriageQueue
You can execute the `ListTriageQueue` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listTriageQueue(options?: ExecuteQueryOptions): QueryPromise<ListTriageQueueData, undefined>;

interface ListTriageQueueRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTriageQueueData, undefined>;
}
export const listTriageQueueRef: ListTriageQueueRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTriageQueue(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTriageQueueData, undefined>;

interface ListTriageQueueRef {
  ...
  (dc: DataConnect): QueryRef<ListTriageQueueData, undefined>;
}
export const listTriageQueueRef: ListTriageQueueRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTriageQueueRef:
```typescript
const name = listTriageQueueRef.operationName;
console.log(name);
```

### Variables
The `ListTriageQueue` query has no variables.
### Return Type
Recall that executing the `ListTriageQueue` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTriageQueueData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListTriageQueueData {
  requests?: unknown[] | null;
}
```
### Using `ListTriageQueue`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTriageQueue } from '@dataconnect/generated';


// Call the `listTriageQueue()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTriageQueue();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTriageQueue(dataConnect);

console.log(data.requests);

// Or, you can use the `Promise` API.
listTriageQueue().then((response) => {
  const data = response.data;
  console.log(data.requests);
});
```

### Using `ListTriageQueue`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTriageQueueRef } from '@dataconnect/generated';


// Call the `listTriageQueueRef()` function to get a reference to the query.
const ref = listTriageQueueRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTriageQueueRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.requests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.requests);
});
```

## ListDonorCommitments
You can execute the `ListDonorCommitments` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listDonorCommitments(options?: ExecuteQueryOptions): QueryPromise<ListDonorCommitmentsData, undefined>;

interface ListDonorCommitmentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDonorCommitmentsData, undefined>;
}
export const listDonorCommitmentsRef: ListDonorCommitmentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDonorCommitments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDonorCommitmentsData, undefined>;

interface ListDonorCommitmentsRef {
  ...
  (dc: DataConnect): QueryRef<ListDonorCommitmentsData, undefined>;
}
export const listDonorCommitmentsRef: ListDonorCommitmentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDonorCommitmentsRef:
```typescript
const name = listDonorCommitmentsRef.operationName;
console.log(name);
```

### Variables
The `ListDonorCommitments` query has no variables.
### Return Type
Recall that executing the `ListDonorCommitments` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDonorCommitmentsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListDonorCommitmentsData {
  commitments?: unknown[] | null;
}
```
### Using `ListDonorCommitments`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDonorCommitments } from '@dataconnect/generated';


// Call the `listDonorCommitments()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDonorCommitments();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDonorCommitments(dataConnect);

console.log(data.commitments);

// Or, you can use the `Promise` API.
listDonorCommitments().then((response) => {
  const data = response.data;
  console.log(data.commitments);
});
```

### Using `ListDonorCommitments`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDonorCommitmentsRef } from '@dataconnect/generated';


// Call the `listDonorCommitmentsRef()` function to get a reference to the query.
const ref = listDonorCommitmentsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDonorCommitmentsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.commitments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.commitments);
});
```

## ListDonorResponses
You can execute the `ListDonorResponses` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listDonorResponses(options?: ExecuteQueryOptions): QueryPromise<ListDonorResponsesData, undefined>;

interface ListDonorResponsesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDonorResponsesData, undefined>;
}
export const listDonorResponsesRef: ListDonorResponsesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDonorResponses(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDonorResponsesData, undefined>;

interface ListDonorResponsesRef {
  ...
  (dc: DataConnect): QueryRef<ListDonorResponsesData, undefined>;
}
export const listDonorResponsesRef: ListDonorResponsesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDonorResponsesRef:
```typescript
const name = listDonorResponsesRef.operationName;
console.log(name);
```

### Variables
The `ListDonorResponses` query has no variables.
### Return Type
Recall that executing the `ListDonorResponses` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDonorResponsesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListDonorResponsesData {
  responses?: unknown[] | null;
}
```
### Using `ListDonorResponses`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDonorResponses } from '@dataconnect/generated';


// Call the `listDonorResponses()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDonorResponses();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDonorResponses(dataConnect);

console.log(data.responses);

// Or, you can use the `Promise` API.
listDonorResponses().then((response) => {
  const data = response.data;
  console.log(data.responses);
});
```

### Using `ListDonorResponses`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDonorResponsesRef } from '@dataconnect/generated';


// Call the `listDonorResponsesRef()` function to get a reference to the query.
const ref = listDonorResponsesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDonorResponsesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.responses);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.responses);
});
```

## GetDonorAvailability
You can execute the `GetDonorAvailability` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getDonorAvailability(options?: ExecuteQueryOptions): QueryPromise<GetDonorAvailabilityData, undefined>;

interface GetDonorAvailabilityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetDonorAvailabilityData, undefined>;
}
export const getDonorAvailabilityRef: GetDonorAvailabilityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDonorAvailability(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetDonorAvailabilityData, undefined>;

interface GetDonorAvailabilityRef {
  ...
  (dc: DataConnect): QueryRef<GetDonorAvailabilityData, undefined>;
}
export const getDonorAvailabilityRef: GetDonorAvailabilityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDonorAvailabilityRef:
```typescript
const name = getDonorAvailabilityRef.operationName;
console.log(name);
```

### Variables
The `GetDonorAvailability` query has no variables.
### Return Type
Recall that executing the `GetDonorAvailability` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDonorAvailabilityData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetDonorAvailabilityData {
  availability?: unknown[] | null;
}
```
### Using `GetDonorAvailability`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDonorAvailability } from '@dataconnect/generated';


// Call the `getDonorAvailability()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDonorAvailability();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDonorAvailability(dataConnect);

console.log(data.availability);

// Or, you can use the `Promise` API.
getDonorAvailability().then((response) => {
  const data = response.data;
  console.log(data.availability);
});
```

### Using `GetDonorAvailability`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDonorAvailabilityRef } from '@dataconnect/generated';


// Call the `getDonorAvailabilityRef()` function to get a reference to the query.
const ref = getDonorAvailabilityRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDonorAvailabilityRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.availability);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.availability);
});
```

## SearchDonorDirectory
You can execute the `SearchDonorDirectory` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
searchDonorDirectory(vars?: SearchDonorDirectoryVariables, options?: ExecuteQueryOptions): QueryPromise<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;

interface SearchDonorDirectoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: SearchDonorDirectoryVariables): QueryRef<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;
}
export const searchDonorDirectoryRef: SearchDonorDirectoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchDonorDirectory(dc: DataConnect, vars?: SearchDonorDirectoryVariables, options?: ExecuteQueryOptions): QueryPromise<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;

interface SearchDonorDirectoryRef {
  ...
  (dc: DataConnect, vars?: SearchDonorDirectoryVariables): QueryRef<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;
}
export const searchDonorDirectoryRef: SearchDonorDirectoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchDonorDirectoryRef:
```typescript
const name = searchDonorDirectoryRef.operationName;
console.log(name);
```

### Variables
The `SearchDonorDirectory` query has an optional argument of type `SearchDonorDirectoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchDonorDirectoryVariables {
  bloodGroup?: string | null;
  district?: string | null;
}
```
### Return Type
Recall that executing the `SearchDonorDirectory` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchDonorDirectoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchDonorDirectoryData {
  donors?: unknown[] | null;
}
```
### Using `SearchDonorDirectory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchDonorDirectory, SearchDonorDirectoryVariables } from '@dataconnect/generated';

// The `SearchDonorDirectory` query has an optional argument of type `SearchDonorDirectoryVariables`:
const searchDonorDirectoryVars: SearchDonorDirectoryVariables = {
  bloodGroup: ..., // optional
  district: ..., // optional
};

// Call the `searchDonorDirectory()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchDonorDirectory(searchDonorDirectoryVars);
// Variables can be defined inline as well.
const { data } = await searchDonorDirectory({ bloodGroup: ..., district: ..., });
// Since all variables are optional for this query, you can omit the `SearchDonorDirectoryVariables` argument.
const { data } = await searchDonorDirectory();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchDonorDirectory(dataConnect, searchDonorDirectoryVars);

console.log(data.donors);

// Or, you can use the `Promise` API.
searchDonorDirectory(searchDonorDirectoryVars).then((response) => {
  const data = response.data;
  console.log(data.donors);
});
```

### Using `SearchDonorDirectory`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchDonorDirectoryRef, SearchDonorDirectoryVariables } from '@dataconnect/generated';

// The `SearchDonorDirectory` query has an optional argument of type `SearchDonorDirectoryVariables`:
const searchDonorDirectoryVars: SearchDonorDirectoryVariables = {
  bloodGroup: ..., // optional
  district: ..., // optional
};

// Call the `searchDonorDirectoryRef()` function to get a reference to the query.
const ref = searchDonorDirectoryRef(searchDonorDirectoryVars);
// Variables can be defined inline as well.
const ref = searchDonorDirectoryRef({ bloodGroup: ..., district: ..., });
// Since all variables are optional for this query, you can omit the `SearchDonorDirectoryVariables` argument.
const ref = searchDonorDirectoryRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchDonorDirectoryRef(dataConnect, searchDonorDirectoryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.donors);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.donors);
});
```

## GetHospitalInventory
You can execute the `GetHospitalInventory` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getHospitalInventory(options?: ExecuteQueryOptions): QueryPromise<GetHospitalInventoryData, undefined>;

interface GetHospitalInventoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetHospitalInventoryData, undefined>;
}
export const getHospitalInventoryRef: GetHospitalInventoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getHospitalInventory(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetHospitalInventoryData, undefined>;

interface GetHospitalInventoryRef {
  ...
  (dc: DataConnect): QueryRef<GetHospitalInventoryData, undefined>;
}
export const getHospitalInventoryRef: GetHospitalInventoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getHospitalInventoryRef:
```typescript
const name = getHospitalInventoryRef.operationName;
console.log(name);
```

### Variables
The `GetHospitalInventory` query has no variables.
### Return Type
Recall that executing the `GetHospitalInventory` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetHospitalInventoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetHospitalInventoryData {
  banks?: unknown[] | null;
}
```
### Using `GetHospitalInventory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getHospitalInventory } from '@dataconnect/generated';


// Call the `getHospitalInventory()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getHospitalInventory();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getHospitalInventory(dataConnect);

console.log(data.banks);

// Or, you can use the `Promise` API.
getHospitalInventory().then((response) => {
  const data = response.data;
  console.log(data.banks);
});
```

### Using `GetHospitalInventory`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getHospitalInventoryRef } from '@dataconnect/generated';


// Call the `getHospitalInventoryRef()` function to get a reference to the query.
const ref = getHospitalInventoryRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getHospitalInventoryRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.banks);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.banks);
});
```

## GetRequestCandidates
You can execute the `GetRequestCandidates` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getRequestCandidates(vars: GetRequestCandidatesVariables, options?: ExecuteQueryOptions): QueryPromise<GetRequestCandidatesData, GetRequestCandidatesVariables>;

interface GetRequestCandidatesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRequestCandidatesVariables): QueryRef<GetRequestCandidatesData, GetRequestCandidatesVariables>;
}
export const getRequestCandidatesRef: GetRequestCandidatesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getRequestCandidates(dc: DataConnect, vars: GetRequestCandidatesVariables, options?: ExecuteQueryOptions): QueryPromise<GetRequestCandidatesData, GetRequestCandidatesVariables>;

interface GetRequestCandidatesRef {
  ...
  (dc: DataConnect, vars: GetRequestCandidatesVariables): QueryRef<GetRequestCandidatesData, GetRequestCandidatesVariables>;
}
export const getRequestCandidatesRef: GetRequestCandidatesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getRequestCandidatesRef:
```typescript
const name = getRequestCandidatesRef.operationName;
console.log(name);
```

### Variables
The `GetRequestCandidates` query requires an argument of type `GetRequestCandidatesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetRequestCandidatesVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that executing the `GetRequestCandidates` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetRequestCandidatesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetRequestCandidatesData {
  candidates?: unknown | null;
}
```
### Using `GetRequestCandidates`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getRequestCandidates, GetRequestCandidatesVariables } from '@dataconnect/generated';

// The `GetRequestCandidates` query requires an argument of type `GetRequestCandidatesVariables`:
const getRequestCandidatesVars: GetRequestCandidatesVariables = {
  requestId: ..., 
};

// Call the `getRequestCandidates()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getRequestCandidates(getRequestCandidatesVars);
// Variables can be defined inline as well.
const { data } = await getRequestCandidates({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getRequestCandidates(dataConnect, getRequestCandidatesVars);

console.log(data.candidates);

// Or, you can use the `Promise` API.
getRequestCandidates(getRequestCandidatesVars).then((response) => {
  const data = response.data;
  console.log(data.candidates);
});
```

### Using `GetRequestCandidates`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getRequestCandidatesRef, GetRequestCandidatesVariables } from '@dataconnect/generated';

// The `GetRequestCandidates` query requires an argument of type `GetRequestCandidatesVariables`:
const getRequestCandidatesVars: GetRequestCandidatesVariables = {
  requestId: ..., 
};

// Call the `getRequestCandidatesRef()` function to get a reference to the query.
const ref = getRequestCandidatesRef(getRequestCandidatesVars);
// Variables can be defined inline as well.
const ref = getRequestCandidatesRef({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getRequestCandidatesRef(dataConnect, getRequestCandidatesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.candidates);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.candidates);
});
```

## GetRequestWorkflow
You can execute the `GetRequestWorkflow` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getRequestWorkflow(vars: GetRequestWorkflowVariables, options?: ExecuteQueryOptions): QueryPromise<GetRequestWorkflowData, GetRequestWorkflowVariables>;

interface GetRequestWorkflowRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRequestWorkflowVariables): QueryRef<GetRequestWorkflowData, GetRequestWorkflowVariables>;
}
export const getRequestWorkflowRef: GetRequestWorkflowRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getRequestWorkflow(dc: DataConnect, vars: GetRequestWorkflowVariables, options?: ExecuteQueryOptions): QueryPromise<GetRequestWorkflowData, GetRequestWorkflowVariables>;

interface GetRequestWorkflowRef {
  ...
  (dc: DataConnect, vars: GetRequestWorkflowVariables): QueryRef<GetRequestWorkflowData, GetRequestWorkflowVariables>;
}
export const getRequestWorkflowRef: GetRequestWorkflowRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getRequestWorkflowRef:
```typescript
const name = getRequestWorkflowRef.operationName;
console.log(name);
```

### Variables
The `GetRequestWorkflow` query requires an argument of type `GetRequestWorkflowVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetRequestWorkflowVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that executing the `GetRequestWorkflow` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetRequestWorkflowData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetRequestWorkflowData {
  workflow?: unknown | null;
}
```
### Using `GetRequestWorkflow`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getRequestWorkflow, GetRequestWorkflowVariables } from '@dataconnect/generated';

// The `GetRequestWorkflow` query requires an argument of type `GetRequestWorkflowVariables`:
const getRequestWorkflowVars: GetRequestWorkflowVariables = {
  requestId: ..., 
};

// Call the `getRequestWorkflow()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getRequestWorkflow(getRequestWorkflowVars);
// Variables can be defined inline as well.
const { data } = await getRequestWorkflow({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getRequestWorkflow(dataConnect, getRequestWorkflowVars);

console.log(data.workflow);

// Or, you can use the `Promise` API.
getRequestWorkflow(getRequestWorkflowVars).then((response) => {
  const data = response.data;
  console.log(data.workflow);
});
```

### Using `GetRequestWorkflow`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getRequestWorkflowRef, GetRequestWorkflowVariables } from '@dataconnect/generated';

// The `GetRequestWorkflow` query requires an argument of type `GetRequestWorkflowVariables`:
const getRequestWorkflowVars: GetRequestWorkflowVariables = {
  requestId: ..., 
};

// Call the `getRequestWorkflowRef()` function to get a reference to the query.
const ref = getRequestWorkflowRef(getRequestWorkflowVars);
// Variables can be defined inline as well.
const ref = getRequestWorkflowRef({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getRequestWorkflowRef(dataConnect, getRequestWorkflowVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.workflow);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.workflow);
});
```

## GetDonorCommitment
You can execute the `GetDonorCommitment` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getDonorCommitment(vars: GetDonorCommitmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDonorCommitmentData, GetDonorCommitmentVariables>;

interface GetDonorCommitmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDonorCommitmentVariables): QueryRef<GetDonorCommitmentData, GetDonorCommitmentVariables>;
}
export const getDonorCommitmentRef: GetDonorCommitmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDonorCommitment(dc: DataConnect, vars: GetDonorCommitmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDonorCommitmentData, GetDonorCommitmentVariables>;

interface GetDonorCommitmentRef {
  ...
  (dc: DataConnect, vars: GetDonorCommitmentVariables): QueryRef<GetDonorCommitmentData, GetDonorCommitmentVariables>;
}
export const getDonorCommitmentRef: GetDonorCommitmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDonorCommitmentRef:
```typescript
const name = getDonorCommitmentRef.operationName;
console.log(name);
```

### Variables
The `GetDonorCommitment` query requires an argument of type `GetDonorCommitmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetDonorCommitmentVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that executing the `GetDonorCommitment` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDonorCommitmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetDonorCommitmentData {
  commitment?: unknown | null;
}
```
### Using `GetDonorCommitment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDonorCommitment, GetDonorCommitmentVariables } from '@dataconnect/generated';

// The `GetDonorCommitment` query requires an argument of type `GetDonorCommitmentVariables`:
const getDonorCommitmentVars: GetDonorCommitmentVariables = {
  requestId: ..., 
};

// Call the `getDonorCommitment()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDonorCommitment(getDonorCommitmentVars);
// Variables can be defined inline as well.
const { data } = await getDonorCommitment({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDonorCommitment(dataConnect, getDonorCommitmentVars);

console.log(data.commitment);

// Or, you can use the `Promise` API.
getDonorCommitment(getDonorCommitmentVars).then((response) => {
  const data = response.data;
  console.log(data.commitment);
});
```

### Using `GetDonorCommitment`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDonorCommitmentRef, GetDonorCommitmentVariables } from '@dataconnect/generated';

// The `GetDonorCommitment` query requires an argument of type `GetDonorCommitmentVariables`:
const getDonorCommitmentVars: GetDonorCommitmentVariables = {
  requestId: ..., 
};

// Call the `getDonorCommitmentRef()` function to get a reference to the query.
const ref = getDonorCommitmentRef(getDonorCommitmentVars);
// Variables can be defined inline as well.
const ref = getDonorCommitmentRef({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDonorCommitmentRef(dataConnect, getDonorCommitmentVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.commitment);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.commitment);
});
```

## ListAlerts
You can execute the `ListAlerts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAlerts(options?: ExecuteQueryOptions): QueryPromise<ListAlertsData, undefined>;

interface ListAlertsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAlertsData, undefined>;
}
export const listAlertsRef: ListAlertsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAlerts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAlertsData, undefined>;

interface ListAlertsRef {
  ...
  (dc: DataConnect): QueryRef<ListAlertsData, undefined>;
}
export const listAlertsRef: ListAlertsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAlertsRef:
```typescript
const name = listAlertsRef.operationName;
console.log(name);
```

### Variables
The `ListAlerts` query has no variables.
### Return Type
Recall that executing the `ListAlerts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAlertsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAlertsData {
  feed?: unknown | null;
}
```
### Using `ListAlerts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAlerts } from '@dataconnect/generated';


// Call the `listAlerts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAlerts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAlerts(dataConnect);

console.log(data.feed);

// Or, you can use the `Promise` API.
listAlerts().then((response) => {
  const data = response.data;
  console.log(data.feed);
});
```

### Using `ListAlerts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAlertsRef } from '@dataconnect/generated';


// Call the `listAlertsRef()` function to get a reference to the query.
const ref = listAlertsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAlertsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.feed);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.feed);
});
```

## GetDashboardSummary
You can execute the `GetDashboardSummary` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getDashboardSummary(options?: ExecuteQueryOptions): QueryPromise<GetDashboardSummaryData, undefined>;

interface GetDashboardSummaryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetDashboardSummaryData, undefined>;
}
export const getDashboardSummaryRef: GetDashboardSummaryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDashboardSummary(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetDashboardSummaryData, undefined>;

interface GetDashboardSummaryRef {
  ...
  (dc: DataConnect): QueryRef<GetDashboardSummaryData, undefined>;
}
export const getDashboardSummaryRef: GetDashboardSummaryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDashboardSummaryRef:
```typescript
const name = getDashboardSummaryRef.operationName;
console.log(name);
```

### Variables
The `GetDashboardSummary` query has no variables.
### Return Type
Recall that executing the `GetDashboardSummary` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDashboardSummaryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetDashboardSummaryData {
  summary?: unknown | null;
}
```
### Using `GetDashboardSummary`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDashboardSummary } from '@dataconnect/generated';


// Call the `getDashboardSummary()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDashboardSummary();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDashboardSummary(dataConnect);

console.log(data.summary);

// Or, you can use the `Promise` API.
getDashboardSummary().then((response) => {
  const data = response.data;
  console.log(data.summary);
});
```

### Using `GetDashboardSummary`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDashboardSummaryRef } from '@dataconnect/generated';


// Call the `getDashboardSummaryRef()` function to get a reference to the query.
const ref = getDashboardSummaryRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDashboardSummaryRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.summary);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.summary);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateEmergencyRequest
You can execute the `CreateEmergencyRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEmergencyRequest(vars: CreateEmergencyRequestVariables): MutationPromise<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;

interface CreateEmergencyRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEmergencyRequestVariables): MutationRef<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;
}
export const createEmergencyRequestRef: CreateEmergencyRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEmergencyRequest(dc: DataConnect, vars: CreateEmergencyRequestVariables): MutationPromise<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;

interface CreateEmergencyRequestRef {
  ...
  (dc: DataConnect, vars: CreateEmergencyRequestVariables): MutationRef<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;
}
export const createEmergencyRequestRef: CreateEmergencyRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEmergencyRequestRef:
```typescript
const name = createEmergencyRequestRef.operationName;
console.log(name);
```

### Variables
The `CreateEmergencyRequest` mutation requires an argument of type `CreateEmergencyRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateEmergencyRequestVariables {
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  district?: string | null;
  registrationNumber?: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes?: string | null;
}
```
### Return Type
Recall that executing the `CreateEmergencyRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEmergencyRequestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEmergencyRequestData {
  request?: unknown | null;
}
```
### Using `CreateEmergencyRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEmergencyRequest, CreateEmergencyRequestVariables } from '@dataconnect/generated';

// The `CreateEmergencyRequest` mutation requires an argument of type `CreateEmergencyRequestVariables`:
const createEmergencyRequestVars: CreateEmergencyRequestVariables = {
  patientName: ..., 
  bloodGroup: ..., 
  units: ..., 
  hospital: ..., 
  district: ..., // optional
  registrationNumber: ..., // optional
  contactName: ..., 
  contactMobile: ..., 
  urgency: ..., 
  notes: ..., // optional
};

// Call the `createEmergencyRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEmergencyRequest(createEmergencyRequestVars);
// Variables can be defined inline as well.
const { data } = await createEmergencyRequest({ patientName: ..., bloodGroup: ..., units: ..., hospital: ..., district: ..., registrationNumber: ..., contactName: ..., contactMobile: ..., urgency: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEmergencyRequest(dataConnect, createEmergencyRequestVars);

console.log(data.request);

// Or, you can use the `Promise` API.
createEmergencyRequest(createEmergencyRequestVars).then((response) => {
  const data = response.data;
  console.log(data.request);
});
```

### Using `CreateEmergencyRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEmergencyRequestRef, CreateEmergencyRequestVariables } from '@dataconnect/generated';

// The `CreateEmergencyRequest` mutation requires an argument of type `CreateEmergencyRequestVariables`:
const createEmergencyRequestVars: CreateEmergencyRequestVariables = {
  patientName: ..., 
  bloodGroup: ..., 
  units: ..., 
  hospital: ..., 
  district: ..., // optional
  registrationNumber: ..., // optional
  contactName: ..., 
  contactMobile: ..., 
  urgency: ..., 
  notes: ..., // optional
};

// Call the `createEmergencyRequestRef()` function to get a reference to the mutation.
const ref = createEmergencyRequestRef(createEmergencyRequestVars);
// Variables can be defined inline as well.
const ref = createEmergencyRequestRef({ patientName: ..., bloodGroup: ..., units: ..., hospital: ..., district: ..., registrationNumber: ..., contactName: ..., contactMobile: ..., urgency: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEmergencyRequestRef(dataConnect, createEmergencyRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.request);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.request);
});
```

## CreateEmergencyRequestAsUser
You can execute the `CreateEmergencyRequestAsUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEmergencyRequestAsUser(vars: CreateEmergencyRequestAsUserVariables): MutationPromise<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;

interface CreateEmergencyRequestAsUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEmergencyRequestAsUserVariables): MutationRef<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;
}
export const createEmergencyRequestAsUserRef: CreateEmergencyRequestAsUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEmergencyRequestAsUser(dc: DataConnect, vars: CreateEmergencyRequestAsUserVariables): MutationPromise<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;

interface CreateEmergencyRequestAsUserRef {
  ...
  (dc: DataConnect, vars: CreateEmergencyRequestAsUserVariables): MutationRef<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;
}
export const createEmergencyRequestAsUserRef: CreateEmergencyRequestAsUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEmergencyRequestAsUserRef:
```typescript
const name = createEmergencyRequestAsUserRef.operationName;
console.log(name);
```

### Variables
The `CreateEmergencyRequestAsUser` mutation requires an argument of type `CreateEmergencyRequestAsUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateEmergencyRequestAsUserVariables {
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  district?: string | null;
  registrationNumber?: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes?: string | null;
}
```
### Return Type
Recall that executing the `CreateEmergencyRequestAsUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEmergencyRequestAsUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEmergencyRequestAsUserData {
  request?: unknown | null;
}
```
### Using `CreateEmergencyRequestAsUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEmergencyRequestAsUser, CreateEmergencyRequestAsUserVariables } from '@dataconnect/generated';

// The `CreateEmergencyRequestAsUser` mutation requires an argument of type `CreateEmergencyRequestAsUserVariables`:
const createEmergencyRequestAsUserVars: CreateEmergencyRequestAsUserVariables = {
  patientName: ..., 
  bloodGroup: ..., 
  units: ..., 
  hospital: ..., 
  district: ..., // optional
  registrationNumber: ..., // optional
  contactName: ..., 
  contactMobile: ..., 
  urgency: ..., 
  notes: ..., // optional
};

// Call the `createEmergencyRequestAsUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEmergencyRequestAsUser(createEmergencyRequestAsUserVars);
// Variables can be defined inline as well.
const { data } = await createEmergencyRequestAsUser({ patientName: ..., bloodGroup: ..., units: ..., hospital: ..., district: ..., registrationNumber: ..., contactName: ..., contactMobile: ..., urgency: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEmergencyRequestAsUser(dataConnect, createEmergencyRequestAsUserVars);

console.log(data.request);

// Or, you can use the `Promise` API.
createEmergencyRequestAsUser(createEmergencyRequestAsUserVars).then((response) => {
  const data = response.data;
  console.log(data.request);
});
```

### Using `CreateEmergencyRequestAsUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEmergencyRequestAsUserRef, CreateEmergencyRequestAsUserVariables } from '@dataconnect/generated';

// The `CreateEmergencyRequestAsUser` mutation requires an argument of type `CreateEmergencyRequestAsUserVariables`:
const createEmergencyRequestAsUserVars: CreateEmergencyRequestAsUserVariables = {
  patientName: ..., 
  bloodGroup: ..., 
  units: ..., 
  hospital: ..., 
  district: ..., // optional
  registrationNumber: ..., // optional
  contactName: ..., 
  contactMobile: ..., 
  urgency: ..., 
  notes: ..., // optional
};

// Call the `createEmergencyRequestAsUserRef()` function to get a reference to the mutation.
const ref = createEmergencyRequestAsUserRef(createEmergencyRequestAsUserVars);
// Variables can be defined inline as well.
const ref = createEmergencyRequestAsUserRef({ patientName: ..., bloodGroup: ..., units: ..., hospital: ..., district: ..., registrationNumber: ..., contactName: ..., contactMobile: ..., urgency: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEmergencyRequestAsUserRef(dataConnect, createEmergencyRequestAsUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.request);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.request);
});
```

## UpdateRequestStatus
You can execute the `UpdateRequestStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateRequestStatus(vars: UpdateRequestStatusVariables): MutationPromise<UpdateRequestStatusData, UpdateRequestStatusVariables>;

interface UpdateRequestStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRequestStatusVariables): MutationRef<UpdateRequestStatusData, UpdateRequestStatusVariables>;
}
export const updateRequestStatusRef: UpdateRequestStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRequestStatus(dc: DataConnect, vars: UpdateRequestStatusVariables): MutationPromise<UpdateRequestStatusData, UpdateRequestStatusVariables>;

interface UpdateRequestStatusRef {
  ...
  (dc: DataConnect, vars: UpdateRequestStatusVariables): MutationRef<UpdateRequestStatusData, UpdateRequestStatusVariables>;
}
export const updateRequestStatusRef: UpdateRequestStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRequestStatusRef:
```typescript
const name = updateRequestStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateRequestStatus` mutation requires an argument of type `UpdateRequestStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateRequestStatusVariables {
  requestId: UUIDString;
  status: RequestStatus;
}
```
### Return Type
Recall that executing the `UpdateRequestStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRequestStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRequestStatusData {
  updated?: unknown | null;
  notifyCompatibleDonors?: number | null;
  notifyRequester?: number | null;
  notifyDonor?: number | null;
}
```
### Using `UpdateRequestStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRequestStatus, UpdateRequestStatusVariables } from '@dataconnect/generated';

// The `UpdateRequestStatus` mutation requires an argument of type `UpdateRequestStatusVariables`:
const updateRequestStatusVars: UpdateRequestStatusVariables = {
  requestId: ..., 
  status: ..., 
};

// Call the `updateRequestStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRequestStatus(updateRequestStatusVars);
// Variables can be defined inline as well.
const { data } = await updateRequestStatus({ requestId: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRequestStatus(dataConnect, updateRequestStatusVars);

console.log(data.updated);
console.log(data.notifyCompatibleDonors);
console.log(data.notifyRequester);
console.log(data.notifyDonor);

// Or, you can use the `Promise` API.
updateRequestStatus(updateRequestStatusVars).then((response) => {
  const data = response.data;
  console.log(data.updated);
  console.log(data.notifyCompatibleDonors);
  console.log(data.notifyRequester);
  console.log(data.notifyDonor);
});
```

### Using `UpdateRequestStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRequestStatusRef, UpdateRequestStatusVariables } from '@dataconnect/generated';

// The `UpdateRequestStatus` mutation requires an argument of type `UpdateRequestStatusVariables`:
const updateRequestStatusVars: UpdateRequestStatusVariables = {
  requestId: ..., 
  status: ..., 
};

// Call the `updateRequestStatusRef()` function to get a reference to the mutation.
const ref = updateRequestStatusRef(updateRequestStatusVars);
// Variables can be defined inline as well.
const ref = updateRequestStatusRef({ requestId: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRequestStatusRef(dataConnect, updateRequestStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.updated);
console.log(data.notifyCompatibleDonors);
console.log(data.notifyRequester);
console.log(data.notifyDonor);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.updated);
  console.log(data.notifyCompatibleDonors);
  console.log(data.notifyRequester);
  console.log(data.notifyDonor);
});
```

## RegisterUser
You can execute the `RegisterUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
registerUser(vars: RegisterUserVariables): MutationPromise<RegisterUserData, RegisterUserVariables>;

interface RegisterUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterUserVariables): MutationRef<RegisterUserData, RegisterUserVariables>;
}
export const registerUserRef: RegisterUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
registerUser(dc: DataConnect, vars: RegisterUserVariables): MutationPromise<RegisterUserData, RegisterUserVariables>;

interface RegisterUserRef {
  ...
  (dc: DataConnect, vars: RegisterUserVariables): MutationRef<RegisterUserData, RegisterUserVariables>;
}
export const registerUserRef: RegisterUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registerUserRef:
```typescript
const name = registerUserRef.operationName;
console.log(name);
```

### Variables
The `RegisterUser` mutation requires an argument of type `RegisterUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegisterUserVariables {
  role: UserRole;
  fullName: string;
  district?: string | null;
  bloodGroup?: string | null;
  registrationNumber?: string | null;
  lastDonationAt?: TimestampString | null;
  email?: string | null;
  mobile?: string | null;
}
```
### Return Type
Recall that executing the `RegisterUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegisterUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegisterUserData {
  created?: unknown | null;
  availability?: number | null;
}
```
### Using `RegisterUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registerUser, RegisterUserVariables } from '@dataconnect/generated';

// The `RegisterUser` mutation requires an argument of type `RegisterUserVariables`:
const registerUserVars: RegisterUserVariables = {
  role: ..., 
  fullName: ..., 
  district: ..., // optional
  bloodGroup: ..., // optional
  registrationNumber: ..., // optional
  lastDonationAt: ..., // optional
  email: ..., // optional
  mobile: ..., // optional
};

// Call the `registerUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registerUser(registerUserVars);
// Variables can be defined inline as well.
const { data } = await registerUser({ role: ..., fullName: ..., district: ..., bloodGroup: ..., registrationNumber: ..., lastDonationAt: ..., email: ..., mobile: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registerUser(dataConnect, registerUserVars);

console.log(data.created);
console.log(data.availability);

// Or, you can use the `Promise` API.
registerUser(registerUserVars).then((response) => {
  const data = response.data;
  console.log(data.created);
  console.log(data.availability);
});
```

### Using `RegisterUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, registerUserRef, RegisterUserVariables } from '@dataconnect/generated';

// The `RegisterUser` mutation requires an argument of type `RegisterUserVariables`:
const registerUserVars: RegisterUserVariables = {
  role: ..., 
  fullName: ..., 
  district: ..., // optional
  bloodGroup: ..., // optional
  registrationNumber: ..., // optional
  lastDonationAt: ..., // optional
  email: ..., // optional
  mobile: ..., // optional
};

// Call the `registerUserRef()` function to get a reference to the mutation.
const ref = registerUserRef(registerUserVars);
// Variables can be defined inline as well.
const ref = registerUserRef({ role: ..., fullName: ..., district: ..., bloodGroup: ..., registrationNumber: ..., lastDonationAt: ..., email: ..., mobile: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registerUserRef(dataConnect, registerUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.created);
console.log(data.availability);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.created);
  console.log(data.availability);
});
```

## UpdateDonorProfile
You can execute the `UpdateDonorProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateDonorProfile(vars: UpdateDonorProfileVariables): MutationPromise<UpdateDonorProfileData, UpdateDonorProfileVariables>;

interface UpdateDonorProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDonorProfileVariables): MutationRef<UpdateDonorProfileData, UpdateDonorProfileVariables>;
}
export const updateDonorProfileRef: UpdateDonorProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateDonorProfile(dc: DataConnect, vars: UpdateDonorProfileVariables): MutationPromise<UpdateDonorProfileData, UpdateDonorProfileVariables>;

interface UpdateDonorProfileRef {
  ...
  (dc: DataConnect, vars: UpdateDonorProfileVariables): MutationRef<UpdateDonorProfileData, UpdateDonorProfileVariables>;
}
export const updateDonorProfileRef: UpdateDonorProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateDonorProfileRef:
```typescript
const name = updateDonorProfileRef.operationName;
console.log(name);
```

### Variables
The `UpdateDonorProfile` mutation requires an argument of type `UpdateDonorProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateDonorProfileVariables {
  fullName: string;
  email?: string | null;
  mobile?: string | null;
  district?: string | null;
  bloodGroup?: string | null;
}
```
### Return Type
Recall that executing the `UpdateDonorProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateDonorProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateDonorProfileData {
  dup?: {
    users: ({
      uid: string;
    } & User_Key)[];
  };
    updated?: unknown | null;
}
```
### Using `UpdateDonorProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateDonorProfile, UpdateDonorProfileVariables } from '@dataconnect/generated';

// The `UpdateDonorProfile` mutation requires an argument of type `UpdateDonorProfileVariables`:
const updateDonorProfileVars: UpdateDonorProfileVariables = {
  fullName: ..., 
  email: ..., // optional
  mobile: ..., // optional
  district: ..., // optional
  bloodGroup: ..., // optional
};

// Call the `updateDonorProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateDonorProfile(updateDonorProfileVars);
// Variables can be defined inline as well.
const { data } = await updateDonorProfile({ fullName: ..., email: ..., mobile: ..., district: ..., bloodGroup: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateDonorProfile(dataConnect, updateDonorProfileVars);

console.log(data.dup);
console.log(data.updated);

// Or, you can use the `Promise` API.
updateDonorProfile(updateDonorProfileVars).then((response) => {
  const data = response.data;
  console.log(data.dup);
  console.log(data.updated);
});
```

### Using `UpdateDonorProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateDonorProfileRef, UpdateDonorProfileVariables } from '@dataconnect/generated';

// The `UpdateDonorProfile` mutation requires an argument of type `UpdateDonorProfileVariables`:
const updateDonorProfileVars: UpdateDonorProfileVariables = {
  fullName: ..., 
  email: ..., // optional
  mobile: ..., // optional
  district: ..., // optional
  bloodGroup: ..., // optional
};

// Call the `updateDonorProfileRef()` function to get a reference to the mutation.
const ref = updateDonorProfileRef(updateDonorProfileVars);
// Variables can be defined inline as well.
const ref = updateDonorProfileRef({ fullName: ..., email: ..., mobile: ..., district: ..., bloodGroup: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateDonorProfileRef(dataConnect, updateDonorProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dup);
console.log(data.updated);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dup);
  console.log(data.updated);
});
```

## UpdateRecipientDistrict
You can execute the `UpdateRecipientDistrict` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateRecipientDistrict(vars?: UpdateRecipientDistrictVariables): MutationPromise<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;

interface UpdateRecipientDistrictRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpdateRecipientDistrictVariables): MutationRef<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;
}
export const updateRecipientDistrictRef: UpdateRecipientDistrictRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRecipientDistrict(dc: DataConnect, vars?: UpdateRecipientDistrictVariables): MutationPromise<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;

interface UpdateRecipientDistrictRef {
  ...
  (dc: DataConnect, vars?: UpdateRecipientDistrictVariables): MutationRef<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;
}
export const updateRecipientDistrictRef: UpdateRecipientDistrictRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRecipientDistrictRef:
```typescript
const name = updateRecipientDistrictRef.operationName;
console.log(name);
```

### Variables
The `UpdateRecipientDistrict` mutation has an optional argument of type `UpdateRecipientDistrictVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateRecipientDistrictVariables {
  district?: string | null;
}
```
### Return Type
Recall that executing the `UpdateRecipientDistrict` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRecipientDistrictData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRecipientDistrictData {
  updated?: unknown | null;
}
```
### Using `UpdateRecipientDistrict`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRecipientDistrict, UpdateRecipientDistrictVariables } from '@dataconnect/generated';

// The `UpdateRecipientDistrict` mutation has an optional argument of type `UpdateRecipientDistrictVariables`:
const updateRecipientDistrictVars: UpdateRecipientDistrictVariables = {
  district: ..., // optional
};

// Call the `updateRecipientDistrict()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRecipientDistrict(updateRecipientDistrictVars);
// Variables can be defined inline as well.
const { data } = await updateRecipientDistrict({ district: ..., });
// Since all variables are optional for this mutation, you can omit the `UpdateRecipientDistrictVariables` argument.
const { data } = await updateRecipientDistrict();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRecipientDistrict(dataConnect, updateRecipientDistrictVars);

console.log(data.updated);

// Or, you can use the `Promise` API.
updateRecipientDistrict(updateRecipientDistrictVars).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

### Using `UpdateRecipientDistrict`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRecipientDistrictRef, UpdateRecipientDistrictVariables } from '@dataconnect/generated';

// The `UpdateRecipientDistrict` mutation has an optional argument of type `UpdateRecipientDistrictVariables`:
const updateRecipientDistrictVars: UpdateRecipientDistrictVariables = {
  district: ..., // optional
};

// Call the `updateRecipientDistrictRef()` function to get a reference to the mutation.
const ref = updateRecipientDistrictRef(updateRecipientDistrictVars);
// Variables can be defined inline as well.
const ref = updateRecipientDistrictRef({ district: ..., });
// Since all variables are optional for this mutation, you can omit the `UpdateRecipientDistrictVariables` argument.
const ref = updateRecipientDistrictRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRecipientDistrictRef(dataConnect, updateRecipientDistrictVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.updated);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

## RespondToRequest
You can execute the `RespondToRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
respondToRequest(vars: RespondToRequestVariables): MutationPromise<RespondToRequestData, RespondToRequestVariables>;

interface RespondToRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RespondToRequestVariables): MutationRef<RespondToRequestData, RespondToRequestVariables>;
}
export const respondToRequestRef: RespondToRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
respondToRequest(dc: DataConnect, vars: RespondToRequestVariables): MutationPromise<RespondToRequestData, RespondToRequestVariables>;

interface RespondToRequestRef {
  ...
  (dc: DataConnect, vars: RespondToRequestVariables): MutationRef<RespondToRequestData, RespondToRequestVariables>;
}
export const respondToRequestRef: RespondToRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the respondToRequestRef:
```typescript
const name = respondToRequestRef.operationName;
console.log(name);
```

### Variables
The `RespondToRequest` mutation requires an argument of type `RespondToRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RespondToRequestVariables {
  requestId: UUIDString;
  response: DonorResponse;
}
```
### Return Type
Recall that executing the `RespondToRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RespondToRequestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RespondToRequestData {
  created?: unknown | null;
  alert?: number | null;
}
```
### Using `RespondToRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, respondToRequest, RespondToRequestVariables } from '@dataconnect/generated';

// The `RespondToRequest` mutation requires an argument of type `RespondToRequestVariables`:
const respondToRequestVars: RespondToRequestVariables = {
  requestId: ..., 
  response: ..., 
};

// Call the `respondToRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await respondToRequest(respondToRequestVars);
// Variables can be defined inline as well.
const { data } = await respondToRequest({ requestId: ..., response: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await respondToRequest(dataConnect, respondToRequestVars);

console.log(data.created);
console.log(data.alert);

// Or, you can use the `Promise` API.
respondToRequest(respondToRequestVars).then((response) => {
  const data = response.data;
  console.log(data.created);
  console.log(data.alert);
});
```

### Using `RespondToRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, respondToRequestRef, RespondToRequestVariables } from '@dataconnect/generated';

// The `RespondToRequest` mutation requires an argument of type `RespondToRequestVariables`:
const respondToRequestVars: RespondToRequestVariables = {
  requestId: ..., 
  response: ..., 
};

// Call the `respondToRequestRef()` function to get a reference to the mutation.
const ref = respondToRequestRef(respondToRequestVars);
// Variables can be defined inline as well.
const ref = respondToRequestRef({ requestId: ..., response: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = respondToRequestRef(dataConnect, respondToRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.created);
console.log(data.alert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.created);
  console.log(data.alert);
});
```

## UpdateDonorResponse
You can execute the `UpdateDonorResponse` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateDonorResponse(vars: UpdateDonorResponseVariables): MutationPromise<UpdateDonorResponseData, UpdateDonorResponseVariables>;

interface UpdateDonorResponseRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDonorResponseVariables): MutationRef<UpdateDonorResponseData, UpdateDonorResponseVariables>;
}
export const updateDonorResponseRef: UpdateDonorResponseRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateDonorResponse(dc: DataConnect, vars: UpdateDonorResponseVariables): MutationPromise<UpdateDonorResponseData, UpdateDonorResponseVariables>;

interface UpdateDonorResponseRef {
  ...
  (dc: DataConnect, vars: UpdateDonorResponseVariables): MutationRef<UpdateDonorResponseData, UpdateDonorResponseVariables>;
}
export const updateDonorResponseRef: UpdateDonorResponseRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateDonorResponseRef:
```typescript
const name = updateDonorResponseRef.operationName;
console.log(name);
```

### Variables
The `UpdateDonorResponse` mutation requires an argument of type `UpdateDonorResponseVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateDonorResponseVariables {
  requestId: UUIDString;
  response: DonorResponse;
}
```
### Return Type
Recall that executing the `UpdateDonorResponse` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateDonorResponseData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateDonorResponseData {
  updated?: unknown | null;
}
```
### Using `UpdateDonorResponse`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateDonorResponse, UpdateDonorResponseVariables } from '@dataconnect/generated';

// The `UpdateDonorResponse` mutation requires an argument of type `UpdateDonorResponseVariables`:
const updateDonorResponseVars: UpdateDonorResponseVariables = {
  requestId: ..., 
  response: ..., 
};

// Call the `updateDonorResponse()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateDonorResponse(updateDonorResponseVars);
// Variables can be defined inline as well.
const { data } = await updateDonorResponse({ requestId: ..., response: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateDonorResponse(dataConnect, updateDonorResponseVars);

console.log(data.updated);

// Or, you can use the `Promise` API.
updateDonorResponse(updateDonorResponseVars).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

### Using `UpdateDonorResponse`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateDonorResponseRef, UpdateDonorResponseVariables } from '@dataconnect/generated';

// The `UpdateDonorResponse` mutation requires an argument of type `UpdateDonorResponseVariables`:
const updateDonorResponseVars: UpdateDonorResponseVariables = {
  requestId: ..., 
  response: ..., 
};

// Call the `updateDonorResponseRef()` function to get a reference to the mutation.
const ref = updateDonorResponseRef(updateDonorResponseVars);
// Variables can be defined inline as well.
const ref = updateDonorResponseRef({ requestId: ..., response: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateDonorResponseRef(dataConnect, updateDonorResponseVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.updated);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

## DeleteDonorResponse
You can execute the `DeleteDonorResponse` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteDonorResponse(vars: DeleteDonorResponseVariables): MutationPromise<DeleteDonorResponseData, DeleteDonorResponseVariables>;

interface DeleteDonorResponseRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDonorResponseVariables): MutationRef<DeleteDonorResponseData, DeleteDonorResponseVariables>;
}
export const deleteDonorResponseRef: DeleteDonorResponseRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteDonorResponse(dc: DataConnect, vars: DeleteDonorResponseVariables): MutationPromise<DeleteDonorResponseData, DeleteDonorResponseVariables>;

interface DeleteDonorResponseRef {
  ...
  (dc: DataConnect, vars: DeleteDonorResponseVariables): MutationRef<DeleteDonorResponseData, DeleteDonorResponseVariables>;
}
export const deleteDonorResponseRef: DeleteDonorResponseRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteDonorResponseRef:
```typescript
const name = deleteDonorResponseRef.operationName;
console.log(name);
```

### Variables
The `DeleteDonorResponse` mutation requires an argument of type `DeleteDonorResponseVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteDonorResponseVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteDonorResponse` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteDonorResponseData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteDonorResponseData {
  deleted?: unknown | null;
}
```
### Using `DeleteDonorResponse`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteDonorResponse, DeleteDonorResponseVariables } from '@dataconnect/generated';

// The `DeleteDonorResponse` mutation requires an argument of type `DeleteDonorResponseVariables`:
const deleteDonorResponseVars: DeleteDonorResponseVariables = {
  requestId: ..., 
};

// Call the `deleteDonorResponse()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteDonorResponse(deleteDonorResponseVars);
// Variables can be defined inline as well.
const { data } = await deleteDonorResponse({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteDonorResponse(dataConnect, deleteDonorResponseVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteDonorResponse(deleteDonorResponseVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteDonorResponse`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteDonorResponseRef, DeleteDonorResponseVariables } from '@dataconnect/generated';

// The `DeleteDonorResponse` mutation requires an argument of type `DeleteDonorResponseVariables`:
const deleteDonorResponseVars: DeleteDonorResponseVariables = {
  requestId: ..., 
};

// Call the `deleteDonorResponseRef()` function to get a reference to the mutation.
const ref = deleteDonorResponseRef(deleteDonorResponseVars);
// Variables can be defined inline as well.
const ref = deleteDonorResponseRef({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteDonorResponseRef(dataConnect, deleteDonorResponseVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## SetDonorAvailability
You can execute the `SetDonorAvailability` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setDonorAvailability(vars: SetDonorAvailabilityVariables): MutationPromise<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;

interface SetDonorAvailabilityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetDonorAvailabilityVariables): MutationRef<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;
}
export const setDonorAvailabilityRef: SetDonorAvailabilityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setDonorAvailability(dc: DataConnect, vars: SetDonorAvailabilityVariables): MutationPromise<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;

interface SetDonorAvailabilityRef {
  ...
  (dc: DataConnect, vars: SetDonorAvailabilityVariables): MutationRef<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;
}
export const setDonorAvailabilityRef: SetDonorAvailabilityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setDonorAvailabilityRef:
```typescript
const name = setDonorAvailabilityRef.operationName;
console.log(name);
```

### Variables
The `SetDonorAvailability` mutation requires an argument of type `SetDonorAvailabilityVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetDonorAvailabilityVariables {
  isAvailable: boolean;
  lastDonationAt?: TimestampString | null;
  hasLastDonation: boolean;
}
```
### Return Type
Recall that executing the `SetDonorAvailability` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetDonorAvailabilityData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetDonorAvailabilityData {
  availability?: unknown | null;
}
```
### Using `SetDonorAvailability`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setDonorAvailability, SetDonorAvailabilityVariables } from '@dataconnect/generated';

// The `SetDonorAvailability` mutation requires an argument of type `SetDonorAvailabilityVariables`:
const setDonorAvailabilityVars: SetDonorAvailabilityVariables = {
  isAvailable: ..., 
  lastDonationAt: ..., // optional
  hasLastDonation: ..., 
};

// Call the `setDonorAvailability()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setDonorAvailability(setDonorAvailabilityVars);
// Variables can be defined inline as well.
const { data } = await setDonorAvailability({ isAvailable: ..., lastDonationAt: ..., hasLastDonation: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setDonorAvailability(dataConnect, setDonorAvailabilityVars);

console.log(data.availability);

// Or, you can use the `Promise` API.
setDonorAvailability(setDonorAvailabilityVars).then((response) => {
  const data = response.data;
  console.log(data.availability);
});
```

### Using `SetDonorAvailability`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setDonorAvailabilityRef, SetDonorAvailabilityVariables } from '@dataconnect/generated';

// The `SetDonorAvailability` mutation requires an argument of type `SetDonorAvailabilityVariables`:
const setDonorAvailabilityVars: SetDonorAvailabilityVariables = {
  isAvailable: ..., 
  lastDonationAt: ..., // optional
  hasLastDonation: ..., 
};

// Call the `setDonorAvailabilityRef()` function to get a reference to the mutation.
const ref = setDonorAvailabilityRef(setDonorAvailabilityVars);
// Variables can be defined inline as well.
const ref = setDonorAvailabilityRef({ isAvailable: ..., lastDonationAt: ..., hasLastDonation: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setDonorAvailabilityRef(dataConnect, setDonorAvailabilityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.availability);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.availability);
});
```

## DeleteDonorAvailability
You can execute the `DeleteDonorAvailability` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteDonorAvailability(): MutationPromise<DeleteDonorAvailabilityData, undefined>;

interface DeleteDonorAvailabilityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteDonorAvailabilityData, undefined>;
}
export const deleteDonorAvailabilityRef: DeleteDonorAvailabilityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteDonorAvailability(dc: DataConnect): MutationPromise<DeleteDonorAvailabilityData, undefined>;

interface DeleteDonorAvailabilityRef {
  ...
  (dc: DataConnect): MutationRef<DeleteDonorAvailabilityData, undefined>;
}
export const deleteDonorAvailabilityRef: DeleteDonorAvailabilityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteDonorAvailabilityRef:
```typescript
const name = deleteDonorAvailabilityRef.operationName;
console.log(name);
```

### Variables
The `DeleteDonorAvailability` mutation has no variables.
### Return Type
Recall that executing the `DeleteDonorAvailability` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteDonorAvailabilityData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteDonorAvailabilityData {
  deleted?: unknown | null;
}
```
### Using `DeleteDonorAvailability`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteDonorAvailability } from '@dataconnect/generated';


// Call the `deleteDonorAvailability()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteDonorAvailability();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteDonorAvailability(dataConnect);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteDonorAvailability().then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteDonorAvailability`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteDonorAvailabilityRef } from '@dataconnect/generated';


// Call the `deleteDonorAvailabilityRef()` function to get a reference to the mutation.
const ref = deleteDonorAvailabilityRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteDonorAvailabilityRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## StartDonorTransit
You can execute the `StartDonorTransit` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
startDonorTransit(vars: StartDonorTransitVariables): MutationPromise<StartDonorTransitData, StartDonorTransitVariables>;

interface StartDonorTransitRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: StartDonorTransitVariables): MutationRef<StartDonorTransitData, StartDonorTransitVariables>;
}
export const startDonorTransitRef: StartDonorTransitRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
startDonorTransit(dc: DataConnect, vars: StartDonorTransitVariables): MutationPromise<StartDonorTransitData, StartDonorTransitVariables>;

interface StartDonorTransitRef {
  ...
  (dc: DataConnect, vars: StartDonorTransitVariables): MutationRef<StartDonorTransitData, StartDonorTransitVariables>;
}
export const startDonorTransitRef: StartDonorTransitRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the startDonorTransitRef:
```typescript
const name = startDonorTransitRef.operationName;
console.log(name);
```

### Variables
The `StartDonorTransit` mutation requires an argument of type `StartDonorTransitVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface StartDonorTransitVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that executing the `StartDonorTransit` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `StartDonorTransitData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface StartDonorTransitData {
  updated?: unknown | null;
}
```
### Using `StartDonorTransit`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, startDonorTransit, StartDonorTransitVariables } from '@dataconnect/generated';

// The `StartDonorTransit` mutation requires an argument of type `StartDonorTransitVariables`:
const startDonorTransitVars: StartDonorTransitVariables = {
  requestId: ..., 
};

// Call the `startDonorTransit()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await startDonorTransit(startDonorTransitVars);
// Variables can be defined inline as well.
const { data } = await startDonorTransit({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await startDonorTransit(dataConnect, startDonorTransitVars);

console.log(data.updated);

// Or, you can use the `Promise` API.
startDonorTransit(startDonorTransitVars).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

### Using `StartDonorTransit`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, startDonorTransitRef, StartDonorTransitVariables } from '@dataconnect/generated';

// The `StartDonorTransit` mutation requires an argument of type `StartDonorTransitVariables`:
const startDonorTransitVars: StartDonorTransitVariables = {
  requestId: ..., 
};

// Call the `startDonorTransitRef()` function to get a reference to the mutation.
const ref = startDonorTransitRef(startDonorTransitVars);
// Variables can be defined inline as well.
const ref = startDonorTransitRef({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = startDonorTransitRef(dataConnect, startDonorTransitVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.updated);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

## CreateDonorCheckInTicket
You can execute the `CreateDonorCheckInTicket` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createDonorCheckInTicket(vars: CreateDonorCheckInTicketVariables): MutationPromise<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;

interface CreateDonorCheckInTicketRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateDonorCheckInTicketVariables): MutationRef<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;
}
export const createDonorCheckInTicketRef: CreateDonorCheckInTicketRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createDonorCheckInTicket(dc: DataConnect, vars: CreateDonorCheckInTicketVariables): MutationPromise<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;

interface CreateDonorCheckInTicketRef {
  ...
  (dc: DataConnect, vars: CreateDonorCheckInTicketVariables): MutationRef<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;
}
export const createDonorCheckInTicketRef: CreateDonorCheckInTicketRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createDonorCheckInTicketRef:
```typescript
const name = createDonorCheckInTicketRef.operationName;
console.log(name);
```

### Variables
The `CreateDonorCheckInTicket` mutation requires an argument of type `CreateDonorCheckInTicketVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateDonorCheckInTicketVariables {
  requestId: UUIDString;
  tokenHash: string;
}
```
### Return Type
Recall that executing the `CreateDonorCheckInTicket` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateDonorCheckInTicketData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateDonorCheckInTicketData {
  ticket?: unknown | null;
}
```
### Using `CreateDonorCheckInTicket`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createDonorCheckInTicket, CreateDonorCheckInTicketVariables } from '@dataconnect/generated';

// The `CreateDonorCheckInTicket` mutation requires an argument of type `CreateDonorCheckInTicketVariables`:
const createDonorCheckInTicketVars: CreateDonorCheckInTicketVariables = {
  requestId: ..., 
  tokenHash: ..., 
};

// Call the `createDonorCheckInTicket()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createDonorCheckInTicket(createDonorCheckInTicketVars);
// Variables can be defined inline as well.
const { data } = await createDonorCheckInTicket({ requestId: ..., tokenHash: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createDonorCheckInTicket(dataConnect, createDonorCheckInTicketVars);

console.log(data.ticket);

// Or, you can use the `Promise` API.
createDonorCheckInTicket(createDonorCheckInTicketVars).then((response) => {
  const data = response.data;
  console.log(data.ticket);
});
```

### Using `CreateDonorCheckInTicket`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createDonorCheckInTicketRef, CreateDonorCheckInTicketVariables } from '@dataconnect/generated';

// The `CreateDonorCheckInTicket` mutation requires an argument of type `CreateDonorCheckInTicketVariables`:
const createDonorCheckInTicketVars: CreateDonorCheckInTicketVariables = {
  requestId: ..., 
  tokenHash: ..., 
};

// Call the `createDonorCheckInTicketRef()` function to get a reference to the mutation.
const ref = createDonorCheckInTicketRef(createDonorCheckInTicketVars);
// Variables can be defined inline as well.
const ref = createDonorCheckInTicketRef({ requestId: ..., tokenHash: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createDonorCheckInTicketRef(dataConnect, createDonorCheckInTicketVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ticket);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ticket);
});
```

## VerifyDonorCheckIn
You can execute the `VerifyDonorCheckIn` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
verifyDonorCheckIn(vars: VerifyDonorCheckInVariables): MutationPromise<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;

interface VerifyDonorCheckInRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: VerifyDonorCheckInVariables): MutationRef<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;
}
export const verifyDonorCheckInRef: VerifyDonorCheckInRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
verifyDonorCheckIn(dc: DataConnect, vars: VerifyDonorCheckInVariables): MutationPromise<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;

interface VerifyDonorCheckInRef {
  ...
  (dc: DataConnect, vars: VerifyDonorCheckInVariables): MutationRef<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;
}
export const verifyDonorCheckInRef: VerifyDonorCheckInRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the verifyDonorCheckInRef:
```typescript
const name = verifyDonorCheckInRef.operationName;
console.log(name);
```

### Variables
The `VerifyDonorCheckIn` mutation requires an argument of type `VerifyDonorCheckInVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface VerifyDonorCheckInVariables {
  requestId: UUIDString;
  tokenHash: string;
}
```
### Return Type
Recall that executing the `VerifyDonorCheckIn` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `VerifyDonorCheckInData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface VerifyDonorCheckInData {
  verified?: unknown | null;
}
```
### Using `VerifyDonorCheckIn`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, verifyDonorCheckIn, VerifyDonorCheckInVariables } from '@dataconnect/generated';

// The `VerifyDonorCheckIn` mutation requires an argument of type `VerifyDonorCheckInVariables`:
const verifyDonorCheckInVars: VerifyDonorCheckInVariables = {
  requestId: ..., 
  tokenHash: ..., 
};

// Call the `verifyDonorCheckIn()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await verifyDonorCheckIn(verifyDonorCheckInVars);
// Variables can be defined inline as well.
const { data } = await verifyDonorCheckIn({ requestId: ..., tokenHash: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await verifyDonorCheckIn(dataConnect, verifyDonorCheckInVars);

console.log(data.verified);

// Or, you can use the `Promise` API.
verifyDonorCheckIn(verifyDonorCheckInVars).then((response) => {
  const data = response.data;
  console.log(data.verified);
});
```

### Using `VerifyDonorCheckIn`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, verifyDonorCheckInRef, VerifyDonorCheckInVariables } from '@dataconnect/generated';

// The `VerifyDonorCheckIn` mutation requires an argument of type `VerifyDonorCheckInVariables`:
const verifyDonorCheckInVars: VerifyDonorCheckInVariables = {
  requestId: ..., 
  tokenHash: ..., 
};

// Call the `verifyDonorCheckInRef()` function to get a reference to the mutation.
const ref = verifyDonorCheckInRef(verifyDonorCheckInVars);
// Variables can be defined inline as well.
const ref = verifyDonorCheckInRef({ requestId: ..., tokenHash: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = verifyDonorCheckInRef(dataConnect, verifyDonorCheckInVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.verified);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.verified);
});
```

## SubmitScreening
You can execute the `SubmitScreening` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
submitScreening(vars: SubmitScreeningVariables): MutationPromise<SubmitScreeningData, SubmitScreeningVariables>;

interface SubmitScreeningRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitScreeningVariables): MutationRef<SubmitScreeningData, SubmitScreeningVariables>;
}
export const submitScreeningRef: SubmitScreeningRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
submitScreening(dc: DataConnect, vars: SubmitScreeningVariables): MutationPromise<SubmitScreeningData, SubmitScreeningVariables>;

interface SubmitScreeningRef {
  ...
  (dc: DataConnect, vars: SubmitScreeningVariables): MutationRef<SubmitScreeningData, SubmitScreeningVariables>;
}
export const submitScreeningRef: SubmitScreeningRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the submitScreeningRef:
```typescript
const name = submitScreeningRef.operationName;
console.log(name);
```

### Variables
The `SubmitScreening` mutation requires an argument of type `SubmitScreeningVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SubmitScreeningVariables {
  requestId: UUIDString;
  temperature?: string | null;
  bloodPressure?: string | null;
  pulse?: string | null;
  hemoglobin?: string | null;
  eligible: boolean;
  bedLabel?: string | null;
}
```
### Return Type
Recall that executing the `SubmitScreening` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SubmitScreeningData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SubmitScreeningData {
  screening?: unknown | null;
}
```
### Using `SubmitScreening`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, submitScreening, SubmitScreeningVariables } from '@dataconnect/generated';

// The `SubmitScreening` mutation requires an argument of type `SubmitScreeningVariables`:
const submitScreeningVars: SubmitScreeningVariables = {
  requestId: ..., 
  temperature: ..., // optional
  bloodPressure: ..., // optional
  pulse: ..., // optional
  hemoglobin: ..., // optional
  eligible: ..., 
  bedLabel: ..., // optional
};

// Call the `submitScreening()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await submitScreening(submitScreeningVars);
// Variables can be defined inline as well.
const { data } = await submitScreening({ requestId: ..., temperature: ..., bloodPressure: ..., pulse: ..., hemoglobin: ..., eligible: ..., bedLabel: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await submitScreening(dataConnect, submitScreeningVars);

console.log(data.screening);

// Or, you can use the `Promise` API.
submitScreening(submitScreeningVars).then((response) => {
  const data = response.data;
  console.log(data.screening);
});
```

### Using `SubmitScreening`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, submitScreeningRef, SubmitScreeningVariables } from '@dataconnect/generated';

// The `SubmitScreening` mutation requires an argument of type `SubmitScreeningVariables`:
const submitScreeningVars: SubmitScreeningVariables = {
  requestId: ..., 
  temperature: ..., // optional
  bloodPressure: ..., // optional
  pulse: ..., // optional
  hemoglobin: ..., // optional
  eligible: ..., 
  bedLabel: ..., // optional
};

// Call the `submitScreeningRef()` function to get a reference to the mutation.
const ref = submitScreeningRef(submitScreeningVars);
// Variables can be defined inline as well.
const ref = submitScreeningRef({ requestId: ..., temperature: ..., bloodPressure: ..., pulse: ..., hemoglobin: ..., eligible: ..., bedLabel: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = submitScreeningRef(dataConnect, submitScreeningVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.screening);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.screening);
});
```

## StartExtraction
You can execute the `StartExtraction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
startExtraction(vars: StartExtractionVariables): MutationPromise<StartExtractionData, StartExtractionVariables>;

interface StartExtractionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: StartExtractionVariables): MutationRef<StartExtractionData, StartExtractionVariables>;
}
export const startExtractionRef: StartExtractionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
startExtraction(dc: DataConnect, vars: StartExtractionVariables): MutationPromise<StartExtractionData, StartExtractionVariables>;

interface StartExtractionRef {
  ...
  (dc: DataConnect, vars: StartExtractionVariables): MutationRef<StartExtractionData, StartExtractionVariables>;
}
export const startExtractionRef: StartExtractionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the startExtractionRef:
```typescript
const name = startExtractionRef.operationName;
console.log(name);
```

### Variables
The `StartExtraction` mutation requires an argument of type `StartExtractionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface StartExtractionVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that executing the `StartExtraction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `StartExtractionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface StartExtractionData {
  extraction?: unknown | null;
}
```
### Using `StartExtraction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, startExtraction, StartExtractionVariables } from '@dataconnect/generated';

// The `StartExtraction` mutation requires an argument of type `StartExtractionVariables`:
const startExtractionVars: StartExtractionVariables = {
  requestId: ..., 
};

// Call the `startExtraction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await startExtraction(startExtractionVars);
// Variables can be defined inline as well.
const { data } = await startExtraction({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await startExtraction(dataConnect, startExtractionVars);

console.log(data.extraction);

// Or, you can use the `Promise` API.
startExtraction(startExtractionVars).then((response) => {
  const data = response.data;
  console.log(data.extraction);
});
```

### Using `StartExtraction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, startExtractionRef, StartExtractionVariables } from '@dataconnect/generated';

// The `StartExtraction` mutation requires an argument of type `StartExtractionVariables`:
const startExtractionVars: StartExtractionVariables = {
  requestId: ..., 
};

// Call the `startExtractionRef()` function to get a reference to the mutation.
const ref = startExtractionRef(startExtractionVars);
// Variables can be defined inline as well.
const ref = startExtractionRef({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = startExtractionRef(dataConnect, startExtractionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.extraction);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.extraction);
});
```

## CompleteExtraction
You can execute the `CompleteExtraction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
completeExtraction(vars: CompleteExtractionVariables): MutationPromise<CompleteExtractionData, CompleteExtractionVariables>;

interface CompleteExtractionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CompleteExtractionVariables): MutationRef<CompleteExtractionData, CompleteExtractionVariables>;
}
export const completeExtractionRef: CompleteExtractionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
completeExtraction(dc: DataConnect, vars: CompleteExtractionVariables): MutationPromise<CompleteExtractionData, CompleteExtractionVariables>;

interface CompleteExtractionRef {
  ...
  (dc: DataConnect, vars: CompleteExtractionVariables): MutationRef<CompleteExtractionData, CompleteExtractionVariables>;
}
export const completeExtractionRef: CompleteExtractionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the completeExtractionRef:
```typescript
const name = completeExtractionRef.operationName;
console.log(name);
```

### Variables
The `CompleteExtraction` mutation requires an argument of type `CompleteExtractionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CompleteExtractionVariables {
  requestId: UUIDString;
  volumeMl?: number | null;
  phlebotomistName?: string | null;
}
```
### Return Type
Recall that executing the `CompleteExtraction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CompleteExtractionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CompleteExtractionData {
  extraction?: unknown | null;
}
```
### Using `CompleteExtraction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, completeExtraction, CompleteExtractionVariables } from '@dataconnect/generated';

// The `CompleteExtraction` mutation requires an argument of type `CompleteExtractionVariables`:
const completeExtractionVars: CompleteExtractionVariables = {
  requestId: ..., 
  volumeMl: ..., // optional
  phlebotomistName: ..., // optional
};

// Call the `completeExtraction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await completeExtraction(completeExtractionVars);
// Variables can be defined inline as well.
const { data } = await completeExtraction({ requestId: ..., volumeMl: ..., phlebotomistName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await completeExtraction(dataConnect, completeExtractionVars);

console.log(data.extraction);

// Or, you can use the `Promise` API.
completeExtraction(completeExtractionVars).then((response) => {
  const data = response.data;
  console.log(data.extraction);
});
```

### Using `CompleteExtraction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, completeExtractionRef, CompleteExtractionVariables } from '@dataconnect/generated';

// The `CompleteExtraction` mutation requires an argument of type `CompleteExtractionVariables`:
const completeExtractionVars: CompleteExtractionVariables = {
  requestId: ..., 
  volumeMl: ..., // optional
  phlebotomistName: ..., // optional
};

// Call the `completeExtractionRef()` function to get a reference to the mutation.
const ref = completeExtractionRef(completeExtractionVars);
// Variables can be defined inline as well.
const ref = completeExtractionRef({ requestId: ..., volumeMl: ..., phlebotomistName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = completeExtractionRef(dataConnect, completeExtractionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.extraction);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.extraction);
});
```

## CompleteDonationCase
You can execute the `CompleteDonationCase` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
completeDonationCase(vars: CompleteDonationCaseVariables): MutationPromise<CompleteDonationCaseData, CompleteDonationCaseVariables>;

interface CompleteDonationCaseRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CompleteDonationCaseVariables): MutationRef<CompleteDonationCaseData, CompleteDonationCaseVariables>;
}
export const completeDonationCaseRef: CompleteDonationCaseRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
completeDonationCase(dc: DataConnect, vars: CompleteDonationCaseVariables): MutationPromise<CompleteDonationCaseData, CompleteDonationCaseVariables>;

interface CompleteDonationCaseRef {
  ...
  (dc: DataConnect, vars: CompleteDonationCaseVariables): MutationRef<CompleteDonationCaseData, CompleteDonationCaseVariables>;
}
export const completeDonationCaseRef: CompleteDonationCaseRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the completeDonationCaseRef:
```typescript
const name = completeDonationCaseRef.operationName;
console.log(name);
```

### Variables
The `CompleteDonationCase` mutation requires an argument of type `CompleteDonationCaseVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CompleteDonationCaseVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that executing the `CompleteDonationCase` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CompleteDonationCaseData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CompleteDonationCaseData {
  first?: unknown | null;
  second?: number | null;
}
```
### Using `CompleteDonationCase`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, completeDonationCase, CompleteDonationCaseVariables } from '@dataconnect/generated';

// The `CompleteDonationCase` mutation requires an argument of type `CompleteDonationCaseVariables`:
const completeDonationCaseVars: CompleteDonationCaseVariables = {
  requestId: ..., 
};

// Call the `completeDonationCase()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await completeDonationCase(completeDonationCaseVars);
// Variables can be defined inline as well.
const { data } = await completeDonationCase({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await completeDonationCase(dataConnect, completeDonationCaseVars);

console.log(data.first);
console.log(data.second);

// Or, you can use the `Promise` API.
completeDonationCase(completeDonationCaseVars).then((response) => {
  const data = response.data;
  console.log(data.first);
  console.log(data.second);
});
```

### Using `CompleteDonationCase`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, completeDonationCaseRef, CompleteDonationCaseVariables } from '@dataconnect/generated';

// The `CompleteDonationCase` mutation requires an argument of type `CompleteDonationCaseVariables`:
const completeDonationCaseVars: CompleteDonationCaseVariables = {
  requestId: ..., 
};

// Call the `completeDonationCaseRef()` function to get a reference to the mutation.
const ref = completeDonationCaseRef(completeDonationCaseVars);
// Variables can be defined inline as well.
const ref = completeDonationCaseRef({ requestId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = completeDonationCaseRef(dataConnect, completeDonationCaseVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.first);
console.log(data.second);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.first);
  console.log(data.second);
});
```

## UpdateInventoryItem
You can execute the `UpdateInventoryItem` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateInventoryItem(vars: UpdateInventoryItemVariables): MutationPromise<UpdateInventoryItemData, UpdateInventoryItemVariables>;

interface UpdateInventoryItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInventoryItemVariables): MutationRef<UpdateInventoryItemData, UpdateInventoryItemVariables>;
}
export const updateInventoryItemRef: UpdateInventoryItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateInventoryItem(dc: DataConnect, vars: UpdateInventoryItemVariables): MutationPromise<UpdateInventoryItemData, UpdateInventoryItemVariables>;

interface UpdateInventoryItemRef {
  ...
  (dc: DataConnect, vars: UpdateInventoryItemVariables): MutationRef<UpdateInventoryItemData, UpdateInventoryItemVariables>;
}
export const updateInventoryItemRef: UpdateInventoryItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateInventoryItemRef:
```typescript
const name = updateInventoryItemRef.operationName;
console.log(name);
```

### Variables
The `UpdateInventoryItem` mutation requires an argument of type `UpdateInventoryItemVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateInventoryItemVariables {
  bankId: UUIDString;
  bloodGroup: string;
  component: BloodComponent;
  units: number;
}
```
### Return Type
Recall that executing the `UpdateInventoryItem` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateInventoryItemData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateInventoryItemData {
  inventory?: unknown | null;
}
```
### Using `UpdateInventoryItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateInventoryItem, UpdateInventoryItemVariables } from '@dataconnect/generated';

// The `UpdateInventoryItem` mutation requires an argument of type `UpdateInventoryItemVariables`:
const updateInventoryItemVars: UpdateInventoryItemVariables = {
  bankId: ..., 
  bloodGroup: ..., 
  component: ..., 
  units: ..., 
};

// Call the `updateInventoryItem()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateInventoryItem(updateInventoryItemVars);
// Variables can be defined inline as well.
const { data } = await updateInventoryItem({ bankId: ..., bloodGroup: ..., component: ..., units: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateInventoryItem(dataConnect, updateInventoryItemVars);

console.log(data.inventory);

// Or, you can use the `Promise` API.
updateInventoryItem(updateInventoryItemVars).then((response) => {
  const data = response.data;
  console.log(data.inventory);
});
```

### Using `UpdateInventoryItem`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateInventoryItemRef, UpdateInventoryItemVariables } from '@dataconnect/generated';

// The `UpdateInventoryItem` mutation requires an argument of type `UpdateInventoryItemVariables`:
const updateInventoryItemVars: UpdateInventoryItemVariables = {
  bankId: ..., 
  bloodGroup: ..., 
  component: ..., 
  units: ..., 
};

// Call the `updateInventoryItemRef()` function to get a reference to the mutation.
const ref = updateInventoryItemRef(updateInventoryItemVars);
// Variables can be defined inline as well.
const ref = updateInventoryItemRef({ bankId: ..., bloodGroup: ..., component: ..., units: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateInventoryItemRef(dataConnect, updateInventoryItemVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.inventory);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.inventory);
});
```

## UpdatePushToken
You can execute the `UpdatePushToken` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updatePushToken(vars: UpdatePushTokenVariables): MutationPromise<UpdatePushTokenData, UpdatePushTokenVariables>;

interface UpdatePushTokenRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePushTokenVariables): MutationRef<UpdatePushTokenData, UpdatePushTokenVariables>;
}
export const updatePushTokenRef: UpdatePushTokenRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePushToken(dc: DataConnect, vars: UpdatePushTokenVariables): MutationPromise<UpdatePushTokenData, UpdatePushTokenVariables>;

interface UpdatePushTokenRef {
  ...
  (dc: DataConnect, vars: UpdatePushTokenVariables): MutationRef<UpdatePushTokenData, UpdatePushTokenVariables>;
}
export const updatePushTokenRef: UpdatePushTokenRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePushTokenRef:
```typescript
const name = updatePushTokenRef.operationName;
console.log(name);
```

### Variables
The `UpdatePushToken` mutation requires an argument of type `UpdatePushTokenVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdatePushTokenVariables {
  token: string;
}
```
### Return Type
Recall that executing the `UpdatePushToken` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePushTokenData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePushTokenData {
  updated?: number | null;
}
```
### Using `UpdatePushToken`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePushToken, UpdatePushTokenVariables } from '@dataconnect/generated';

// The `UpdatePushToken` mutation requires an argument of type `UpdatePushTokenVariables`:
const updatePushTokenVars: UpdatePushTokenVariables = {
  token: ..., 
};

// Call the `updatePushToken()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePushToken(updatePushTokenVars);
// Variables can be defined inline as well.
const { data } = await updatePushToken({ token: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePushToken(dataConnect, updatePushTokenVars);

console.log(data.updated);

// Or, you can use the `Promise` API.
updatePushToken(updatePushTokenVars).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

### Using `UpdatePushToken`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePushTokenRef, UpdatePushTokenVariables } from '@dataconnect/generated';

// The `UpdatePushToken` mutation requires an argument of type `UpdatePushTokenVariables`:
const updatePushTokenVars: UpdatePushTokenVariables = {
  token: ..., 
};

// Call the `updatePushTokenRef()` function to get a reference to the mutation.
const ref = updatePushTokenRef(updatePushTokenVars);
// Variables can be defined inline as well.
const ref = updatePushTokenRef({ token: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePushTokenRef(dataConnect, updatePushTokenVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.updated);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

## MarkAlertsRead
You can execute the `MarkAlertsRead` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
markAlertsRead(vars?: MarkAlertsReadVariables): MutationPromise<MarkAlertsReadData, MarkAlertsReadVariables>;

interface MarkAlertsReadRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: MarkAlertsReadVariables): MutationRef<MarkAlertsReadData, MarkAlertsReadVariables>;
}
export const markAlertsReadRef: MarkAlertsReadRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
markAlertsRead(dc: DataConnect, vars?: MarkAlertsReadVariables): MutationPromise<MarkAlertsReadData, MarkAlertsReadVariables>;

interface MarkAlertsReadRef {
  ...
  (dc: DataConnect, vars?: MarkAlertsReadVariables): MutationRef<MarkAlertsReadData, MarkAlertsReadVariables>;
}
export const markAlertsReadRef: MarkAlertsReadRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the markAlertsReadRef:
```typescript
const name = markAlertsReadRef.operationName;
console.log(name);
```

### Variables
The `MarkAlertsRead` mutation has an optional argument of type `MarkAlertsReadVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MarkAlertsReadVariables {
  ids?: string | null;
}
```
### Return Type
Recall that executing the `MarkAlertsRead` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MarkAlertsReadData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface MarkAlertsReadData {
  updated?: number | null;
}
```
### Using `MarkAlertsRead`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, markAlertsRead, MarkAlertsReadVariables } from '@dataconnect/generated';

// The `MarkAlertsRead` mutation has an optional argument of type `MarkAlertsReadVariables`:
const markAlertsReadVars: MarkAlertsReadVariables = {
  ids: ..., // optional
};

// Call the `markAlertsRead()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await markAlertsRead(markAlertsReadVars);
// Variables can be defined inline as well.
const { data } = await markAlertsRead({ ids: ..., });
// Since all variables are optional for this mutation, you can omit the `MarkAlertsReadVariables` argument.
const { data } = await markAlertsRead();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await markAlertsRead(dataConnect, markAlertsReadVars);

console.log(data.updated);

// Or, you can use the `Promise` API.
markAlertsRead(markAlertsReadVars).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

### Using `MarkAlertsRead`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, markAlertsReadRef, MarkAlertsReadVariables } from '@dataconnect/generated';

// The `MarkAlertsRead` mutation has an optional argument of type `MarkAlertsReadVariables`:
const markAlertsReadVars: MarkAlertsReadVariables = {
  ids: ..., // optional
};

// Call the `markAlertsReadRef()` function to get a reference to the mutation.
const ref = markAlertsReadRef(markAlertsReadVars);
// Variables can be defined inline as well.
const ref = markAlertsReadRef({ ids: ..., });
// Since all variables are optional for this mutation, you can omit the `MarkAlertsReadVariables` argument.
const ref = markAlertsReadRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = markAlertsReadRef(dataConnect, markAlertsReadVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.updated);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.updated);
});
```

