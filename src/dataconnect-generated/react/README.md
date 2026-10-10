# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `default`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`dataconnect-generated/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
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
  - [*MarkAlertsRead*](#markalertsread)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `default`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `default`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `default` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetMe
You can execute the `GetMe` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMe(dc: DataConnect, options?: useDataConnectQueryOptions<GetMeData>): UseDataConnectQueryResult<GetMeData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMe(options?: useDataConnectQueryOptions<GetMeData>): UseDataConnectQueryResult<GetMeData, undefined>;
```

### Variables
The `GetMe` Query has no variables.
### Return Type
Recall that calling the `GetMe` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMe` Query is of type `GetMeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMe`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetMe } from '@dataconnect/generated/react'

export default function GetMeComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMe();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMe(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMe(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMe(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.me);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListBloodBanks
You can execute the `ListBloodBanks` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListBloodBanks(dc: DataConnect, options?: useDataConnectQueryOptions<ListBloodBanksData>): UseDataConnectQueryResult<ListBloodBanksData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListBloodBanks(options?: useDataConnectQueryOptions<ListBloodBanksData>): UseDataConnectQueryResult<ListBloodBanksData, undefined>;
```

### Variables
The `ListBloodBanks` Query has no variables.
### Return Type
Recall that calling the `ListBloodBanks` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListBloodBanks` Query is of type `ListBloodBanksData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListBloodBanksData {
  banks?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListBloodBanks`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListBloodBanks } from '@dataconnect/generated/react'

export default function ListBloodBanksComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListBloodBanks();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListBloodBanks(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListBloodBanks(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListBloodBanks(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.banks);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetBloodBank
You can execute the `GetBloodBank` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetBloodBank(dc: DataConnect, vars: GetBloodBankVariables, options?: useDataConnectQueryOptions<GetBloodBankData>): UseDataConnectQueryResult<GetBloodBankData, GetBloodBankVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBloodBank(vars: GetBloodBankVariables, options?: useDataConnectQueryOptions<GetBloodBankData>): UseDataConnectQueryResult<GetBloodBankData, GetBloodBankVariables>;
```

### Variables
The `GetBloodBank` Query requires an argument of type `GetBloodBankVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBloodBankVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `GetBloodBank` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBloodBank` Query is of type `GetBloodBankData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBloodBankData {
  bank?: unknown | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBloodBank`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBloodBankVariables } from '@dataconnect/generated';
import { useGetBloodBank } from '@dataconnect/generated/react'

export default function GetBloodBankComponent() {
  // The `useGetBloodBank` Query hook requires an argument of type `GetBloodBankVariables`:
  const getBloodBankVars: GetBloodBankVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBloodBank(getBloodBankVars);
  // Variables can be defined inline as well.
  const query = useGetBloodBank({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBloodBank(dataConnect, getBloodBankVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBloodBank(getBloodBankVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBloodBank(dataConnect, getBloodBankVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.bank);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetActiveDonorStats
You can execute the `GetActiveDonorStats` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetActiveDonorStats(dc: DataConnect, options?: useDataConnectQueryOptions<GetActiveDonorStatsData>): UseDataConnectQueryResult<GetActiveDonorStatsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetActiveDonorStats(options?: useDataConnectQueryOptions<GetActiveDonorStatsData>): UseDataConnectQueryResult<GetActiveDonorStatsData, undefined>;
```

### Variables
The `GetActiveDonorStats` Query has no variables.
### Return Type
Recall that calling the `GetActiveDonorStats` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetActiveDonorStats` Query is of type `GetActiveDonorStatsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetActiveDonorStatsData {
  donors?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetActiveDonorStats`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetActiveDonorStats } from '@dataconnect/generated/react'

export default function GetActiveDonorStatsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetActiveDonorStats();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetActiveDonorStats(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetActiveDonorStats(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetActiveDonorStats(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.donors);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetEmergencyRequest
You can execute the `GetEmergencyRequest` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetEmergencyRequest(dc: DataConnect, vars: GetEmergencyRequestVariables, options?: useDataConnectQueryOptions<GetEmergencyRequestData>): UseDataConnectQueryResult<GetEmergencyRequestData, GetEmergencyRequestVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetEmergencyRequest(vars: GetEmergencyRequestVariables, options?: useDataConnectQueryOptions<GetEmergencyRequestData>): UseDataConnectQueryResult<GetEmergencyRequestData, GetEmergencyRequestVariables>;
```

### Variables
The `GetEmergencyRequest` Query requires an argument of type `GetEmergencyRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetEmergencyRequestVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `GetEmergencyRequest` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetEmergencyRequest` Query is of type `GetEmergencyRequestData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetEmergencyRequestData {
  request?: unknown | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetEmergencyRequest`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetEmergencyRequestVariables } from '@dataconnect/generated';
import { useGetEmergencyRequest } from '@dataconnect/generated/react'

export default function GetEmergencyRequestComponent() {
  // The `useGetEmergencyRequest` Query hook requires an argument of type `GetEmergencyRequestVariables`:
  const getEmergencyRequestVars: GetEmergencyRequestVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetEmergencyRequest(getEmergencyRequestVars);
  // Variables can be defined inline as well.
  const query = useGetEmergencyRequest({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetEmergencyRequest(dataConnect, getEmergencyRequestVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetEmergencyRequest(getEmergencyRequestVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetEmergencyRequest(dataConnect, getEmergencyRequestVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.request);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMyRequests
You can execute the `ListMyRequests` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMyRequests(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyRequestsData>): UseDataConnectQueryResult<ListMyRequestsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMyRequests(options?: useDataConnectQueryOptions<ListMyRequestsData>): UseDataConnectQueryResult<ListMyRequestsData, undefined>;
```

### Variables
The `ListMyRequests` Query has no variables.
### Return Type
Recall that calling the `ListMyRequests` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMyRequests` Query is of type `ListMyRequestsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListMyRequestsData {
  requests?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMyRequests`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListMyRequests } from '@dataconnect/generated/react'

export default function ListMyRequestsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMyRequests();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMyRequests(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMyRequests(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMyRequests(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.requests);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListDonorFeed
You can execute the `ListDonorFeed` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListDonorFeed(dc: DataConnect, options?: useDataConnectQueryOptions<ListDonorFeedData>): UseDataConnectQueryResult<ListDonorFeedData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListDonorFeed(options?: useDataConnectQueryOptions<ListDonorFeedData>): UseDataConnectQueryResult<ListDonorFeedData, undefined>;
```

### Variables
The `ListDonorFeed` Query has no variables.
### Return Type
Recall that calling the `ListDonorFeed` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListDonorFeed` Query is of type `ListDonorFeedData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListDonorFeedData {
  requests?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListDonorFeed`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListDonorFeed } from '@dataconnect/generated/react'

export default function ListDonorFeedComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListDonorFeed();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListDonorFeed(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListDonorFeed(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListDonorFeed(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.requests);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListTriageQueue
You can execute the `ListTriageQueue` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListTriageQueue(dc: DataConnect, options?: useDataConnectQueryOptions<ListTriageQueueData>): UseDataConnectQueryResult<ListTriageQueueData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListTriageQueue(options?: useDataConnectQueryOptions<ListTriageQueueData>): UseDataConnectQueryResult<ListTriageQueueData, undefined>;
```

### Variables
The `ListTriageQueue` Query has no variables.
### Return Type
Recall that calling the `ListTriageQueue` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListTriageQueue` Query is of type `ListTriageQueueData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListTriageQueueData {
  requests?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListTriageQueue`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListTriageQueue } from '@dataconnect/generated/react'

export default function ListTriageQueueComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListTriageQueue();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListTriageQueue(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListTriageQueue(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListTriageQueue(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.requests);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListDonorCommitments
You can execute the `ListDonorCommitments` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListDonorCommitments(dc: DataConnect, options?: useDataConnectQueryOptions<ListDonorCommitmentsData>): UseDataConnectQueryResult<ListDonorCommitmentsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListDonorCommitments(options?: useDataConnectQueryOptions<ListDonorCommitmentsData>): UseDataConnectQueryResult<ListDonorCommitmentsData, undefined>;
```

### Variables
The `ListDonorCommitments` Query has no variables.
### Return Type
Recall that calling the `ListDonorCommitments` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListDonorCommitments` Query is of type `ListDonorCommitmentsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListDonorCommitmentsData {
  commitments?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListDonorCommitments`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListDonorCommitments } from '@dataconnect/generated/react'

export default function ListDonorCommitmentsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListDonorCommitments();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListDonorCommitments(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListDonorCommitments(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListDonorCommitments(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.commitments);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListDonorResponses
You can execute the `ListDonorResponses` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListDonorResponses(dc: DataConnect, options?: useDataConnectQueryOptions<ListDonorResponsesData>): UseDataConnectQueryResult<ListDonorResponsesData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListDonorResponses(options?: useDataConnectQueryOptions<ListDonorResponsesData>): UseDataConnectQueryResult<ListDonorResponsesData, undefined>;
```

### Variables
The `ListDonorResponses` Query has no variables.
### Return Type
Recall that calling the `ListDonorResponses` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListDonorResponses` Query is of type `ListDonorResponsesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListDonorResponsesData {
  responses?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListDonorResponses`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListDonorResponses } from '@dataconnect/generated/react'

export default function ListDonorResponsesComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListDonorResponses();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListDonorResponses(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListDonorResponses(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListDonorResponses(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.responses);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetDonorAvailability
You can execute the `GetDonorAvailability` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetDonorAvailability(dc: DataConnect, options?: useDataConnectQueryOptions<GetDonorAvailabilityData>): UseDataConnectQueryResult<GetDonorAvailabilityData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetDonorAvailability(options?: useDataConnectQueryOptions<GetDonorAvailabilityData>): UseDataConnectQueryResult<GetDonorAvailabilityData, undefined>;
```

### Variables
The `GetDonorAvailability` Query has no variables.
### Return Type
Recall that calling the `GetDonorAvailability` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetDonorAvailability` Query is of type `GetDonorAvailabilityData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetDonorAvailabilityData {
  availability?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetDonorAvailability`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetDonorAvailability } from '@dataconnect/generated/react'

export default function GetDonorAvailabilityComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetDonorAvailability();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetDonorAvailability(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetDonorAvailability(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetDonorAvailability(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.availability);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SearchDonorDirectory
You can execute the `SearchDonorDirectory` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useSearchDonorDirectory(dc: DataConnect, vars?: SearchDonorDirectoryVariables, options?: useDataConnectQueryOptions<SearchDonorDirectoryData>): UseDataConnectQueryResult<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useSearchDonorDirectory(vars?: SearchDonorDirectoryVariables, options?: useDataConnectQueryOptions<SearchDonorDirectoryData>): UseDataConnectQueryResult<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;
```

### Variables
The `SearchDonorDirectory` Query has an optional argument of type `SearchDonorDirectoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SearchDonorDirectoryVariables {
  bloodGroup?: string | null;
  district?: string | null;
}
```
### Return Type
Recall that calling the `SearchDonorDirectory` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `SearchDonorDirectory` Query is of type `SearchDonorDirectoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SearchDonorDirectoryData {
  donors?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `SearchDonorDirectory`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SearchDonorDirectoryVariables } from '@dataconnect/generated';
import { useSearchDonorDirectory } from '@dataconnect/generated/react'

export default function SearchDonorDirectoryComponent() {
  // The `useSearchDonorDirectory` Query hook has an optional argument of type `SearchDonorDirectoryVariables`:
  const searchDonorDirectoryVars: SearchDonorDirectoryVariables = {
    bloodGroup: ..., // optional
    district: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useSearchDonorDirectory(searchDonorDirectoryVars);
  // Variables can be defined inline as well.
  const query = useSearchDonorDirectory({ bloodGroup: ..., district: ..., });
  // Since all variables are optional for this Query, you can omit the `SearchDonorDirectoryVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useSearchDonorDirectory();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useSearchDonorDirectory(dataConnect, searchDonorDirectoryVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useSearchDonorDirectory(searchDonorDirectoryVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useSearchDonorDirectory(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useSearchDonorDirectory(dataConnect, searchDonorDirectoryVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.donors);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetHospitalInventory
You can execute the `GetHospitalInventory` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetHospitalInventory(dc: DataConnect, options?: useDataConnectQueryOptions<GetHospitalInventoryData>): UseDataConnectQueryResult<GetHospitalInventoryData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetHospitalInventory(options?: useDataConnectQueryOptions<GetHospitalInventoryData>): UseDataConnectQueryResult<GetHospitalInventoryData, undefined>;
```

### Variables
The `GetHospitalInventory` Query has no variables.
### Return Type
Recall that calling the `GetHospitalInventory` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetHospitalInventory` Query is of type `GetHospitalInventoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetHospitalInventoryData {
  banks?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetHospitalInventory`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetHospitalInventory } from '@dataconnect/generated/react'

export default function GetHospitalInventoryComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetHospitalInventory();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetHospitalInventory(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetHospitalInventory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetHospitalInventory(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.banks);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetRequestCandidates
You can execute the `GetRequestCandidates` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetRequestCandidates(dc: DataConnect, vars: GetRequestCandidatesVariables, options?: useDataConnectQueryOptions<GetRequestCandidatesData>): UseDataConnectQueryResult<GetRequestCandidatesData, GetRequestCandidatesVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetRequestCandidates(vars: GetRequestCandidatesVariables, options?: useDataConnectQueryOptions<GetRequestCandidatesData>): UseDataConnectQueryResult<GetRequestCandidatesData, GetRequestCandidatesVariables>;
```

### Variables
The `GetRequestCandidates` Query requires an argument of type `GetRequestCandidatesVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetRequestCandidatesVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that calling the `GetRequestCandidates` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetRequestCandidates` Query is of type `GetRequestCandidatesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetRequestCandidatesData {
  candidates?: unknown | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetRequestCandidates`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetRequestCandidatesVariables } from '@dataconnect/generated';
import { useGetRequestCandidates } from '@dataconnect/generated/react'

export default function GetRequestCandidatesComponent() {
  // The `useGetRequestCandidates` Query hook requires an argument of type `GetRequestCandidatesVariables`:
  const getRequestCandidatesVars: GetRequestCandidatesVariables = {
    requestId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetRequestCandidates(getRequestCandidatesVars);
  // Variables can be defined inline as well.
  const query = useGetRequestCandidates({ requestId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetRequestCandidates(dataConnect, getRequestCandidatesVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetRequestCandidates(getRequestCandidatesVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetRequestCandidates(dataConnect, getRequestCandidatesVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.candidates);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetRequestWorkflow
You can execute the `GetRequestWorkflow` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetRequestWorkflow(dc: DataConnect, vars: GetRequestWorkflowVariables, options?: useDataConnectQueryOptions<GetRequestWorkflowData>): UseDataConnectQueryResult<GetRequestWorkflowData, GetRequestWorkflowVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetRequestWorkflow(vars: GetRequestWorkflowVariables, options?: useDataConnectQueryOptions<GetRequestWorkflowData>): UseDataConnectQueryResult<GetRequestWorkflowData, GetRequestWorkflowVariables>;
```

### Variables
The `GetRequestWorkflow` Query requires an argument of type `GetRequestWorkflowVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetRequestWorkflowVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that calling the `GetRequestWorkflow` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetRequestWorkflow` Query is of type `GetRequestWorkflowData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetRequestWorkflowData {
  workflow?: unknown | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetRequestWorkflow`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetRequestWorkflowVariables } from '@dataconnect/generated';
import { useGetRequestWorkflow } from '@dataconnect/generated/react'

export default function GetRequestWorkflowComponent() {
  // The `useGetRequestWorkflow` Query hook requires an argument of type `GetRequestWorkflowVariables`:
  const getRequestWorkflowVars: GetRequestWorkflowVariables = {
    requestId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetRequestWorkflow(getRequestWorkflowVars);
  // Variables can be defined inline as well.
  const query = useGetRequestWorkflow({ requestId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetRequestWorkflow(dataConnect, getRequestWorkflowVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetRequestWorkflow(getRequestWorkflowVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetRequestWorkflow(dataConnect, getRequestWorkflowVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.workflow);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetDonorCommitment
You can execute the `GetDonorCommitment` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetDonorCommitment(dc: DataConnect, vars: GetDonorCommitmentVariables, options?: useDataConnectQueryOptions<GetDonorCommitmentData>): UseDataConnectQueryResult<GetDonorCommitmentData, GetDonorCommitmentVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetDonorCommitment(vars: GetDonorCommitmentVariables, options?: useDataConnectQueryOptions<GetDonorCommitmentData>): UseDataConnectQueryResult<GetDonorCommitmentData, GetDonorCommitmentVariables>;
```

### Variables
The `GetDonorCommitment` Query requires an argument of type `GetDonorCommitmentVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetDonorCommitmentVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that calling the `GetDonorCommitment` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetDonorCommitment` Query is of type `GetDonorCommitmentData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetDonorCommitmentData {
  commitment?: unknown | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetDonorCommitment`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetDonorCommitmentVariables } from '@dataconnect/generated';
import { useGetDonorCommitment } from '@dataconnect/generated/react'

export default function GetDonorCommitmentComponent() {
  // The `useGetDonorCommitment` Query hook requires an argument of type `GetDonorCommitmentVariables`:
  const getDonorCommitmentVars: GetDonorCommitmentVariables = {
    requestId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetDonorCommitment(getDonorCommitmentVars);
  // Variables can be defined inline as well.
  const query = useGetDonorCommitment({ requestId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetDonorCommitment(dataConnect, getDonorCommitmentVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetDonorCommitment(getDonorCommitmentVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetDonorCommitment(dataConnect, getDonorCommitmentVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.commitment);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListAlerts
You can execute the `ListAlerts` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListAlerts(dc: DataConnect, options?: useDataConnectQueryOptions<ListAlertsData>): UseDataConnectQueryResult<ListAlertsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListAlerts(options?: useDataConnectQueryOptions<ListAlertsData>): UseDataConnectQueryResult<ListAlertsData, undefined>;
```

### Variables
The `ListAlerts` Query has no variables.
### Return Type
Recall that calling the `ListAlerts` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListAlerts` Query is of type `ListAlertsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListAlertsData {
  feed?: unknown | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListAlerts`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListAlerts } from '@dataconnect/generated/react'

export default function ListAlertsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListAlerts();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListAlerts(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListAlerts(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListAlerts(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.feed);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetDashboardSummary
You can execute the `GetDashboardSummary` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetDashboardSummary(dc: DataConnect, options?: useDataConnectQueryOptions<GetDashboardSummaryData>): UseDataConnectQueryResult<GetDashboardSummaryData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetDashboardSummary(options?: useDataConnectQueryOptions<GetDashboardSummaryData>): UseDataConnectQueryResult<GetDashboardSummaryData, undefined>;
```

### Variables
The `GetDashboardSummary` Query has no variables.
### Return Type
Recall that calling the `GetDashboardSummary` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetDashboardSummary` Query is of type `GetDashboardSummaryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetDashboardSummaryData {
  summary?: unknown | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetDashboardSummary`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetDashboardSummary } from '@dataconnect/generated/react'

export default function GetDashboardSummaryComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetDashboardSummary();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetDashboardSummary(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetDashboardSummary(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetDashboardSummary(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.summary);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

The React generated SDK provides Mutations hook functions that call and return [`useDataConnectMutation`](https://react-query-firebase.invertase.dev/react/data-connect/mutations) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, and the most recent data returned by the Mutation, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/mutations).

Mutation hooks do not execute their Mutations automatically when called. Rather, after calling the Mutation hook function and getting a `UseMutationResult` object, you must call the `UseMutationResult.mutate()` function to execute the Mutation.

To learn more about TanStack React Query's Mutations, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

## Using Mutation Hooks
Here's a general overview of how to use the generated Mutation hooks in your code:

- Mutation hook functions are not called with the arguments to the Mutation. Instead, arguments are passed to `UseMutationResult.mutate()`.
- If the Mutation has no variables, the `mutate()` function does not require arguments.
- If the Mutation has any required variables, the `mutate()` function will require at least one argument: an object that contains all the required variables for the Mutation.
- If the Mutation has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Mutation's variables are optional, the Mutation hook function does not require any arguments.
- Mutation hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Mutation hooks also accept an `options` argument of type `useDataConnectMutationOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations#mutation-side-effects).
  - `UseMutationResult.mutate()` also accepts an `options` argument of type `useDataConnectMutationOptions`.
  - ***Special case:*** If the Mutation has no arguments (or all optional arguments and you wish to provide none), and you want to pass `options` to `UseMutationResult.mutate()`, you must pass `undefined` where you would normally pass the Mutation's arguments, and then may provide the options argument.

Below are examples of how to use the `default` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## CreateEmergencyRequest
You can execute the `CreateEmergencyRequest` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateEmergencyRequest(options?: useDataConnectMutationOptions<CreateEmergencyRequestData, FirebaseError, CreateEmergencyRequestVariables>): UseDataConnectMutationResult<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateEmergencyRequest(dc: DataConnect, options?: useDataConnectMutationOptions<CreateEmergencyRequestData, FirebaseError, CreateEmergencyRequestVariables>): UseDataConnectMutationResult<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;
```

### Variables
The `CreateEmergencyRequest` Mutation requires an argument of type `CreateEmergencyRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `CreateEmergencyRequest` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateEmergencyRequest` Mutation is of type `CreateEmergencyRequestData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateEmergencyRequestData {
  request?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateEmergencyRequest`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateEmergencyRequestVariables } from '@dataconnect/generated';
import { useCreateEmergencyRequest } from '@dataconnect/generated/react'

export default function CreateEmergencyRequestComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateEmergencyRequest();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateEmergencyRequest(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateEmergencyRequest(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateEmergencyRequest(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateEmergencyRequest` Mutation requires an argument of type `CreateEmergencyRequestVariables`:
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
  mutation.mutate(createEmergencyRequestVars);
  // Variables can be defined inline as well.
  mutation.mutate({ patientName: ..., bloodGroup: ..., units: ..., hospital: ..., district: ..., registrationNumber: ..., contactName: ..., contactMobile: ..., urgency: ..., notes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createEmergencyRequestVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.request);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateEmergencyRequestAsUser
You can execute the `CreateEmergencyRequestAsUser` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateEmergencyRequestAsUser(options?: useDataConnectMutationOptions<CreateEmergencyRequestAsUserData, FirebaseError, CreateEmergencyRequestAsUserVariables>): UseDataConnectMutationResult<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateEmergencyRequestAsUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateEmergencyRequestAsUserData, FirebaseError, CreateEmergencyRequestAsUserVariables>): UseDataConnectMutationResult<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;
```

### Variables
The `CreateEmergencyRequestAsUser` Mutation requires an argument of type `CreateEmergencyRequestAsUserVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `CreateEmergencyRequestAsUser` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateEmergencyRequestAsUser` Mutation is of type `CreateEmergencyRequestAsUserData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateEmergencyRequestAsUserData {
  request?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateEmergencyRequestAsUser`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateEmergencyRequestAsUserVariables } from '@dataconnect/generated';
import { useCreateEmergencyRequestAsUser } from '@dataconnect/generated/react'

export default function CreateEmergencyRequestAsUserComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateEmergencyRequestAsUser();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateEmergencyRequestAsUser(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateEmergencyRequestAsUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateEmergencyRequestAsUser(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateEmergencyRequestAsUser` Mutation requires an argument of type `CreateEmergencyRequestAsUserVariables`:
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
  mutation.mutate(createEmergencyRequestAsUserVars);
  // Variables can be defined inline as well.
  mutation.mutate({ patientName: ..., bloodGroup: ..., units: ..., hospital: ..., district: ..., registrationNumber: ..., contactName: ..., contactMobile: ..., urgency: ..., notes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createEmergencyRequestAsUserVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.request);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateRequestStatus
You can execute the `UpdateRequestStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateRequestStatus(options?: useDataConnectMutationOptions<UpdateRequestStatusData, FirebaseError, UpdateRequestStatusVariables>): UseDataConnectMutationResult<UpdateRequestStatusData, UpdateRequestStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateRequestStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateRequestStatusData, FirebaseError, UpdateRequestStatusVariables>): UseDataConnectMutationResult<UpdateRequestStatusData, UpdateRequestStatusVariables>;
```

### Variables
The `UpdateRequestStatus` Mutation requires an argument of type `UpdateRequestStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateRequestStatusVariables {
  requestId: UUIDString;
  status: RequestStatus;
}
```
### Return Type
Recall that calling the `UpdateRequestStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateRequestStatus` Mutation is of type `UpdateRequestStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateRequestStatusData {
  updated?: unknown | null;
  notifyCompatibleDonors?: number | null;
  notifyRequester?: number | null;
  notifyDonor?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateRequestStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateRequestStatusVariables } from '@dataconnect/generated';
import { useUpdateRequestStatus } from '@dataconnect/generated/react'

export default function UpdateRequestStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateRequestStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateRequestStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateRequestStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateRequestStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateRequestStatus` Mutation requires an argument of type `UpdateRequestStatusVariables`:
  const updateRequestStatusVars: UpdateRequestStatusVariables = {
    requestId: ..., 
    status: ..., 
  };
  mutation.mutate(updateRequestStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateRequestStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.updated);
    console.log(mutation.data.notifyCompatibleDonors);
    console.log(mutation.data.notifyRequester);
    console.log(mutation.data.notifyDonor);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RegisterUser
You can execute the `RegisterUser` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRegisterUser(options?: useDataConnectMutationOptions<RegisterUserData, FirebaseError, RegisterUserVariables>): UseDataConnectMutationResult<RegisterUserData, RegisterUserVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRegisterUser(dc: DataConnect, options?: useDataConnectMutationOptions<RegisterUserData, FirebaseError, RegisterUserVariables>): UseDataConnectMutationResult<RegisterUserData, RegisterUserVariables>;
```

### Variables
The `RegisterUser` Mutation requires an argument of type `RegisterUserVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `RegisterUser` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RegisterUser` Mutation is of type `RegisterUserData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RegisterUserData {
  created?: unknown | null;
  availability?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RegisterUser`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RegisterUserVariables } from '@dataconnect/generated';
import { useRegisterUser } from '@dataconnect/generated/react'

export default function RegisterUserComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRegisterUser();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRegisterUser(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRegisterUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRegisterUser(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRegisterUser` Mutation requires an argument of type `RegisterUserVariables`:
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
  mutation.mutate(registerUserVars);
  // Variables can be defined inline as well.
  mutation.mutate({ role: ..., fullName: ..., district: ..., bloodGroup: ..., registrationNumber: ..., lastDonationAt: ..., email: ..., mobile: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(registerUserVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.created);
    console.log(mutation.data.availability);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateDonorProfile
You can execute the `UpdateDonorProfile` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateDonorProfile(options?: useDataConnectMutationOptions<UpdateDonorProfileData, FirebaseError, UpdateDonorProfileVariables>): UseDataConnectMutationResult<UpdateDonorProfileData, UpdateDonorProfileVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateDonorProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateDonorProfileData, FirebaseError, UpdateDonorProfileVariables>): UseDataConnectMutationResult<UpdateDonorProfileData, UpdateDonorProfileVariables>;
```

### Variables
The `UpdateDonorProfile` Mutation requires an argument of type `UpdateDonorProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateDonorProfileVariables {
  fullName: string;
  email?: string | null;
  mobile?: string | null;
  district?: string | null;
  bloodGroup?: string | null;
}
```
### Return Type
Recall that calling the `UpdateDonorProfile` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateDonorProfile` Mutation is of type `UpdateDonorProfileData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateDonorProfileData {
  dup?: {
    users: ({
      uid: string;
    } & User_Key)[];
  };
  updated?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateDonorProfile`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateDonorProfileVariables } from '@dataconnect/generated';
import { useUpdateDonorProfile } from '@dataconnect/generated/react'

export default function UpdateDonorProfileComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateDonorProfile();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateDonorProfile(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateDonorProfile(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateDonorProfile(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateDonorProfile` Mutation requires an argument of type `UpdateDonorProfileVariables`:
  const updateDonorProfileVars: UpdateDonorProfileVariables = {
    fullName: ..., 
    email: ..., // optional
    mobile: ..., // optional
    district: ..., // optional
    bloodGroup: ..., // optional
  };
  mutation.mutate(updateDonorProfileVars);
  // Variables can be defined inline as well.
  mutation.mutate({ fullName: ..., email: ..., mobile: ..., district: ..., bloodGroup: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateDonorProfileVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.dup);
    console.log(mutation.data.updated);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateRecipientDistrict
You can execute the `UpdateRecipientDistrict` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateRecipientDistrict(options?: useDataConnectMutationOptions<UpdateRecipientDistrictData, FirebaseError, UpdateRecipientDistrictVariables | void>): UseDataConnectMutationResult<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateRecipientDistrict(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateRecipientDistrictData, FirebaseError, UpdateRecipientDistrictVariables | void>): UseDataConnectMutationResult<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;
```

### Variables
The `UpdateRecipientDistrict` Mutation has an optional argument of type `UpdateRecipientDistrictVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateRecipientDistrictVariables {
  district?: string | null;
}
```
### Return Type
Recall that calling the `UpdateRecipientDistrict` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateRecipientDistrict` Mutation is of type `UpdateRecipientDistrictData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateRecipientDistrictData {
  updated?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateRecipientDistrict`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateRecipientDistrictVariables } from '@dataconnect/generated';
import { useUpdateRecipientDistrict } from '@dataconnect/generated/react'

export default function UpdateRecipientDistrictComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateRecipientDistrict();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateRecipientDistrict(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateRecipientDistrict(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateRecipientDistrict(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateRecipientDistrict` Mutation has an optional argument of type `UpdateRecipientDistrictVariables`:
  const updateRecipientDistrictVars: UpdateRecipientDistrictVariables = {
    district: ..., // optional
  };
  mutation.mutate(updateRecipientDistrictVars);
  // Variables can be defined inline as well.
  mutation.mutate({ district: ..., });
  // Since all variables are optional for this Mutation, you can omit the `UpdateRecipientDistrictVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateRecipientDistrictVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.updated);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RespondToRequest
You can execute the `RespondToRequest` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRespondToRequest(options?: useDataConnectMutationOptions<RespondToRequestData, FirebaseError, RespondToRequestVariables>): UseDataConnectMutationResult<RespondToRequestData, RespondToRequestVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRespondToRequest(dc: DataConnect, options?: useDataConnectMutationOptions<RespondToRequestData, FirebaseError, RespondToRequestVariables>): UseDataConnectMutationResult<RespondToRequestData, RespondToRequestVariables>;
```

### Variables
The `RespondToRequest` Mutation requires an argument of type `RespondToRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RespondToRequestVariables {
  requestId: UUIDString;
  response: DonorResponse;
}
```
### Return Type
Recall that calling the `RespondToRequest` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RespondToRequest` Mutation is of type `RespondToRequestData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RespondToRequestData {
  created?: unknown | null;
  alert?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RespondToRequest`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RespondToRequestVariables } from '@dataconnect/generated';
import { useRespondToRequest } from '@dataconnect/generated/react'

export default function RespondToRequestComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRespondToRequest();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRespondToRequest(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRespondToRequest(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRespondToRequest(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRespondToRequest` Mutation requires an argument of type `RespondToRequestVariables`:
  const respondToRequestVars: RespondToRequestVariables = {
    requestId: ..., 
    response: ..., 
  };
  mutation.mutate(respondToRequestVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., response: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(respondToRequestVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.created);
    console.log(mutation.data.alert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateDonorResponse
You can execute the `UpdateDonorResponse` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateDonorResponse(options?: useDataConnectMutationOptions<UpdateDonorResponseData, FirebaseError, UpdateDonorResponseVariables>): UseDataConnectMutationResult<UpdateDonorResponseData, UpdateDonorResponseVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateDonorResponse(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateDonorResponseData, FirebaseError, UpdateDonorResponseVariables>): UseDataConnectMutationResult<UpdateDonorResponseData, UpdateDonorResponseVariables>;
```

### Variables
The `UpdateDonorResponse` Mutation requires an argument of type `UpdateDonorResponseVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateDonorResponseVariables {
  requestId: UUIDString;
  response: DonorResponse;
}
```
### Return Type
Recall that calling the `UpdateDonorResponse` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateDonorResponse` Mutation is of type `UpdateDonorResponseData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateDonorResponseData {
  updated?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateDonorResponse`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateDonorResponseVariables } from '@dataconnect/generated';
import { useUpdateDonorResponse } from '@dataconnect/generated/react'

export default function UpdateDonorResponseComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateDonorResponse();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateDonorResponse(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateDonorResponse(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateDonorResponse(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateDonorResponse` Mutation requires an argument of type `UpdateDonorResponseVariables`:
  const updateDonorResponseVars: UpdateDonorResponseVariables = {
    requestId: ..., 
    response: ..., 
  };
  mutation.mutate(updateDonorResponseVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., response: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateDonorResponseVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.updated);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteDonorResponse
You can execute the `DeleteDonorResponse` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteDonorResponse(options?: useDataConnectMutationOptions<DeleteDonorResponseData, FirebaseError, DeleteDonorResponseVariables>): UseDataConnectMutationResult<DeleteDonorResponseData, DeleteDonorResponseVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteDonorResponse(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteDonorResponseData, FirebaseError, DeleteDonorResponseVariables>): UseDataConnectMutationResult<DeleteDonorResponseData, DeleteDonorResponseVariables>;
```

### Variables
The `DeleteDonorResponse` Mutation requires an argument of type `DeleteDonorResponseVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteDonorResponseVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that calling the `DeleteDonorResponse` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteDonorResponse` Mutation is of type `DeleteDonorResponseData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteDonorResponseData {
  deleted?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteDonorResponse`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteDonorResponseVariables } from '@dataconnect/generated';
import { useDeleteDonorResponse } from '@dataconnect/generated/react'

export default function DeleteDonorResponseComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteDonorResponse();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteDonorResponse(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteDonorResponse(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteDonorResponse(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteDonorResponse` Mutation requires an argument of type `DeleteDonorResponseVariables`:
  const deleteDonorResponseVars: DeleteDonorResponseVariables = {
    requestId: ..., 
  };
  mutation.mutate(deleteDonorResponseVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteDonorResponseVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.deleted);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetDonorAvailability
You can execute the `SetDonorAvailability` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetDonorAvailability(options?: useDataConnectMutationOptions<SetDonorAvailabilityData, FirebaseError, SetDonorAvailabilityVariables>): UseDataConnectMutationResult<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetDonorAvailability(dc: DataConnect, options?: useDataConnectMutationOptions<SetDonorAvailabilityData, FirebaseError, SetDonorAvailabilityVariables>): UseDataConnectMutationResult<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;
```

### Variables
The `SetDonorAvailability` Mutation requires an argument of type `SetDonorAvailabilityVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetDonorAvailabilityVariables {
  isAvailable: boolean;
  lastDonationAt?: TimestampString | null;
  hasLastDonation: boolean;
}
```
### Return Type
Recall that calling the `SetDonorAvailability` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetDonorAvailability` Mutation is of type `SetDonorAvailabilityData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetDonorAvailabilityData {
  availability?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetDonorAvailability`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetDonorAvailabilityVariables } from '@dataconnect/generated';
import { useSetDonorAvailability } from '@dataconnect/generated/react'

export default function SetDonorAvailabilityComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetDonorAvailability();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetDonorAvailability(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetDonorAvailability(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetDonorAvailability(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetDonorAvailability` Mutation requires an argument of type `SetDonorAvailabilityVariables`:
  const setDonorAvailabilityVars: SetDonorAvailabilityVariables = {
    isAvailable: ..., 
    lastDonationAt: ..., // optional
    hasLastDonation: ..., 
  };
  mutation.mutate(setDonorAvailabilityVars);
  // Variables can be defined inline as well.
  mutation.mutate({ isAvailable: ..., lastDonationAt: ..., hasLastDonation: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setDonorAvailabilityVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.availability);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteDonorAvailability
You can execute the `DeleteDonorAvailability` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteDonorAvailability(options?: useDataConnectMutationOptions<DeleteDonorAvailabilityData, FirebaseError, void>): UseDataConnectMutationResult<DeleteDonorAvailabilityData, undefined>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteDonorAvailability(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteDonorAvailabilityData, FirebaseError, void>): UseDataConnectMutationResult<DeleteDonorAvailabilityData, undefined>;
```

### Variables
The `DeleteDonorAvailability` Mutation has no variables.
### Return Type
Recall that calling the `DeleteDonorAvailability` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteDonorAvailability` Mutation is of type `DeleteDonorAvailabilityData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteDonorAvailabilityData {
  deleted?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteDonorAvailability`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useDeleteDonorAvailability } from '@dataconnect/generated/react'

export default function DeleteDonorAvailabilityComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteDonorAvailability();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteDonorAvailability(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteDonorAvailability(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteDonorAvailability(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since this Mutation accepts no variables, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(undefined, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.deleted);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## StartDonorTransit
You can execute the `StartDonorTransit` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useStartDonorTransit(options?: useDataConnectMutationOptions<StartDonorTransitData, FirebaseError, StartDonorTransitVariables>): UseDataConnectMutationResult<StartDonorTransitData, StartDonorTransitVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useStartDonorTransit(dc: DataConnect, options?: useDataConnectMutationOptions<StartDonorTransitData, FirebaseError, StartDonorTransitVariables>): UseDataConnectMutationResult<StartDonorTransitData, StartDonorTransitVariables>;
```

### Variables
The `StartDonorTransit` Mutation requires an argument of type `StartDonorTransitVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface StartDonorTransitVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that calling the `StartDonorTransit` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `StartDonorTransit` Mutation is of type `StartDonorTransitData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface StartDonorTransitData {
  updated?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `StartDonorTransit`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, StartDonorTransitVariables } from '@dataconnect/generated';
import { useStartDonorTransit } from '@dataconnect/generated/react'

export default function StartDonorTransitComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useStartDonorTransit();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useStartDonorTransit(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useStartDonorTransit(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useStartDonorTransit(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useStartDonorTransit` Mutation requires an argument of type `StartDonorTransitVariables`:
  const startDonorTransitVars: StartDonorTransitVariables = {
    requestId: ..., 
  };
  mutation.mutate(startDonorTransitVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(startDonorTransitVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.updated);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateDonorCheckInTicket
You can execute the `CreateDonorCheckInTicket` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateDonorCheckInTicket(options?: useDataConnectMutationOptions<CreateDonorCheckInTicketData, FirebaseError, CreateDonorCheckInTicketVariables>): UseDataConnectMutationResult<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateDonorCheckInTicket(dc: DataConnect, options?: useDataConnectMutationOptions<CreateDonorCheckInTicketData, FirebaseError, CreateDonorCheckInTicketVariables>): UseDataConnectMutationResult<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;
```

### Variables
The `CreateDonorCheckInTicket` Mutation requires an argument of type `CreateDonorCheckInTicketVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateDonorCheckInTicketVariables {
  requestId: UUIDString;
  tokenHash: string;
}
```
### Return Type
Recall that calling the `CreateDonorCheckInTicket` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateDonorCheckInTicket` Mutation is of type `CreateDonorCheckInTicketData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateDonorCheckInTicketData {
  ticket?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateDonorCheckInTicket`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateDonorCheckInTicketVariables } from '@dataconnect/generated';
import { useCreateDonorCheckInTicket } from '@dataconnect/generated/react'

export default function CreateDonorCheckInTicketComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateDonorCheckInTicket();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateDonorCheckInTicket(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateDonorCheckInTicket(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateDonorCheckInTicket(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateDonorCheckInTicket` Mutation requires an argument of type `CreateDonorCheckInTicketVariables`:
  const createDonorCheckInTicketVars: CreateDonorCheckInTicketVariables = {
    requestId: ..., 
    tokenHash: ..., 
  };
  mutation.mutate(createDonorCheckInTicketVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., tokenHash: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createDonorCheckInTicketVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.ticket);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## VerifyDonorCheckIn
You can execute the `VerifyDonorCheckIn` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useVerifyDonorCheckIn(options?: useDataConnectMutationOptions<VerifyDonorCheckInData, FirebaseError, VerifyDonorCheckInVariables>): UseDataConnectMutationResult<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useVerifyDonorCheckIn(dc: DataConnect, options?: useDataConnectMutationOptions<VerifyDonorCheckInData, FirebaseError, VerifyDonorCheckInVariables>): UseDataConnectMutationResult<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;
```

### Variables
The `VerifyDonorCheckIn` Mutation requires an argument of type `VerifyDonorCheckInVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface VerifyDonorCheckInVariables {
  requestId: UUIDString;
  tokenHash: string;
}
```
### Return Type
Recall that calling the `VerifyDonorCheckIn` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `VerifyDonorCheckIn` Mutation is of type `VerifyDonorCheckInData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface VerifyDonorCheckInData {
  verified?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `VerifyDonorCheckIn`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, VerifyDonorCheckInVariables } from '@dataconnect/generated';
import { useVerifyDonorCheckIn } from '@dataconnect/generated/react'

export default function VerifyDonorCheckInComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useVerifyDonorCheckIn();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useVerifyDonorCheckIn(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useVerifyDonorCheckIn(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useVerifyDonorCheckIn(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useVerifyDonorCheckIn` Mutation requires an argument of type `VerifyDonorCheckInVariables`:
  const verifyDonorCheckInVars: VerifyDonorCheckInVariables = {
    requestId: ..., 
    tokenHash: ..., 
  };
  mutation.mutate(verifyDonorCheckInVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., tokenHash: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(verifyDonorCheckInVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.verified);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SubmitScreening
You can execute the `SubmitScreening` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSubmitScreening(options?: useDataConnectMutationOptions<SubmitScreeningData, FirebaseError, SubmitScreeningVariables>): UseDataConnectMutationResult<SubmitScreeningData, SubmitScreeningVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSubmitScreening(dc: DataConnect, options?: useDataConnectMutationOptions<SubmitScreeningData, FirebaseError, SubmitScreeningVariables>): UseDataConnectMutationResult<SubmitScreeningData, SubmitScreeningVariables>;
```

### Variables
The `SubmitScreening` Mutation requires an argument of type `SubmitScreeningVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `SubmitScreening` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SubmitScreening` Mutation is of type `SubmitScreeningData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SubmitScreeningData {
  screening?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SubmitScreening`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SubmitScreeningVariables } from '@dataconnect/generated';
import { useSubmitScreening } from '@dataconnect/generated/react'

export default function SubmitScreeningComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSubmitScreening();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSubmitScreening(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSubmitScreening(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSubmitScreening(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSubmitScreening` Mutation requires an argument of type `SubmitScreeningVariables`:
  const submitScreeningVars: SubmitScreeningVariables = {
    requestId: ..., 
    temperature: ..., // optional
    bloodPressure: ..., // optional
    pulse: ..., // optional
    hemoglobin: ..., // optional
    eligible: ..., 
    bedLabel: ..., // optional
  };
  mutation.mutate(submitScreeningVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., temperature: ..., bloodPressure: ..., pulse: ..., hemoglobin: ..., eligible: ..., bedLabel: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(submitScreeningVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.screening);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## StartExtraction
You can execute the `StartExtraction` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useStartExtraction(options?: useDataConnectMutationOptions<StartExtractionData, FirebaseError, StartExtractionVariables>): UseDataConnectMutationResult<StartExtractionData, StartExtractionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useStartExtraction(dc: DataConnect, options?: useDataConnectMutationOptions<StartExtractionData, FirebaseError, StartExtractionVariables>): UseDataConnectMutationResult<StartExtractionData, StartExtractionVariables>;
```

### Variables
The `StartExtraction` Mutation requires an argument of type `StartExtractionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface StartExtractionVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that calling the `StartExtraction` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `StartExtraction` Mutation is of type `StartExtractionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface StartExtractionData {
  extraction?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `StartExtraction`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, StartExtractionVariables } from '@dataconnect/generated';
import { useStartExtraction } from '@dataconnect/generated/react'

export default function StartExtractionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useStartExtraction();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useStartExtraction(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useStartExtraction(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useStartExtraction(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useStartExtraction` Mutation requires an argument of type `StartExtractionVariables`:
  const startExtractionVars: StartExtractionVariables = {
    requestId: ..., 
  };
  mutation.mutate(startExtractionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(startExtractionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.extraction);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CompleteExtraction
You can execute the `CompleteExtraction` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCompleteExtraction(options?: useDataConnectMutationOptions<CompleteExtractionData, FirebaseError, CompleteExtractionVariables>): UseDataConnectMutationResult<CompleteExtractionData, CompleteExtractionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCompleteExtraction(dc: DataConnect, options?: useDataConnectMutationOptions<CompleteExtractionData, FirebaseError, CompleteExtractionVariables>): UseDataConnectMutationResult<CompleteExtractionData, CompleteExtractionVariables>;
```

### Variables
The `CompleteExtraction` Mutation requires an argument of type `CompleteExtractionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CompleteExtractionVariables {
  requestId: UUIDString;
  volumeMl?: number | null;
  phlebotomistName?: string | null;
}
```
### Return Type
Recall that calling the `CompleteExtraction` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CompleteExtraction` Mutation is of type `CompleteExtractionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CompleteExtractionData {
  extraction?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CompleteExtraction`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CompleteExtractionVariables } from '@dataconnect/generated';
import { useCompleteExtraction } from '@dataconnect/generated/react'

export default function CompleteExtractionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCompleteExtraction();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCompleteExtraction(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCompleteExtraction(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCompleteExtraction(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCompleteExtraction` Mutation requires an argument of type `CompleteExtractionVariables`:
  const completeExtractionVars: CompleteExtractionVariables = {
    requestId: ..., 
    volumeMl: ..., // optional
    phlebotomistName: ..., // optional
  };
  mutation.mutate(completeExtractionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., volumeMl: ..., phlebotomistName: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(completeExtractionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.extraction);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CompleteDonationCase
You can execute the `CompleteDonationCase` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCompleteDonationCase(options?: useDataConnectMutationOptions<CompleteDonationCaseData, FirebaseError, CompleteDonationCaseVariables>): UseDataConnectMutationResult<CompleteDonationCaseData, CompleteDonationCaseVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCompleteDonationCase(dc: DataConnect, options?: useDataConnectMutationOptions<CompleteDonationCaseData, FirebaseError, CompleteDonationCaseVariables>): UseDataConnectMutationResult<CompleteDonationCaseData, CompleteDonationCaseVariables>;
```

### Variables
The `CompleteDonationCase` Mutation requires an argument of type `CompleteDonationCaseVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CompleteDonationCaseVariables {
  requestId: UUIDString;
}
```
### Return Type
Recall that calling the `CompleteDonationCase` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CompleteDonationCase` Mutation is of type `CompleteDonationCaseData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CompleteDonationCaseData {
  first?: unknown | null;
  second?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CompleteDonationCase`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CompleteDonationCaseVariables } from '@dataconnect/generated';
import { useCompleteDonationCase } from '@dataconnect/generated/react'

export default function CompleteDonationCaseComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCompleteDonationCase();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCompleteDonationCase(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCompleteDonationCase(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCompleteDonationCase(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCompleteDonationCase` Mutation requires an argument of type `CompleteDonationCaseVariables`:
  const completeDonationCaseVars: CompleteDonationCaseVariables = {
    requestId: ..., 
  };
  mutation.mutate(completeDonationCaseVars);
  // Variables can be defined inline as well.
  mutation.mutate({ requestId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(completeDonationCaseVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.first);
    console.log(mutation.data.second);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateInventoryItem
You can execute the `UpdateInventoryItem` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateInventoryItem(options?: useDataConnectMutationOptions<UpdateInventoryItemData, FirebaseError, UpdateInventoryItemVariables>): UseDataConnectMutationResult<UpdateInventoryItemData, UpdateInventoryItemVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateInventoryItem(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateInventoryItemData, FirebaseError, UpdateInventoryItemVariables>): UseDataConnectMutationResult<UpdateInventoryItemData, UpdateInventoryItemVariables>;
```

### Variables
The `UpdateInventoryItem` Mutation requires an argument of type `UpdateInventoryItemVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateInventoryItemVariables {
  bankId: UUIDString;
  bloodGroup: string;
  component: BloodComponent;
  units: number;
}
```
### Return Type
Recall that calling the `UpdateInventoryItem` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateInventoryItem` Mutation is of type `UpdateInventoryItemData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateInventoryItemData {
  inventory?: unknown | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateInventoryItem`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateInventoryItemVariables } from '@dataconnect/generated';
import { useUpdateInventoryItem } from '@dataconnect/generated/react'

export default function UpdateInventoryItemComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateInventoryItem();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateInventoryItem(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateInventoryItem(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateInventoryItem(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateInventoryItem` Mutation requires an argument of type `UpdateInventoryItemVariables`:
  const updateInventoryItemVars: UpdateInventoryItemVariables = {
    bankId: ..., 
    bloodGroup: ..., 
    component: ..., 
    units: ..., 
  };
  mutation.mutate(updateInventoryItemVars);
  // Variables can be defined inline as well.
  mutation.mutate({ bankId: ..., bloodGroup: ..., component: ..., units: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateInventoryItemVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.inventory);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## MarkAlertsRead
You can execute the `MarkAlertsRead` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useMarkAlertsRead(options?: useDataConnectMutationOptions<MarkAlertsReadData, FirebaseError, MarkAlertsReadVariables | void>): UseDataConnectMutationResult<MarkAlertsReadData, MarkAlertsReadVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useMarkAlertsRead(dc: DataConnect, options?: useDataConnectMutationOptions<MarkAlertsReadData, FirebaseError, MarkAlertsReadVariables | void>): UseDataConnectMutationResult<MarkAlertsReadData, MarkAlertsReadVariables>;
```

### Variables
The `MarkAlertsRead` Mutation has an optional argument of type `MarkAlertsReadVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface MarkAlertsReadVariables {
  ids?: string | null;
}
```
### Return Type
Recall that calling the `MarkAlertsRead` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `MarkAlertsRead` Mutation is of type `MarkAlertsReadData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface MarkAlertsReadData {
  updated?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `MarkAlertsRead`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, MarkAlertsReadVariables } from '@dataconnect/generated';
import { useMarkAlertsRead } from '@dataconnect/generated/react'

export default function MarkAlertsReadComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useMarkAlertsRead();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useMarkAlertsRead(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkAlertsRead(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkAlertsRead(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useMarkAlertsRead` Mutation has an optional argument of type `MarkAlertsReadVariables`:
  const markAlertsReadVars: MarkAlertsReadVariables = {
    ids: ..., // optional
  };
  mutation.mutate(markAlertsReadVars);
  // Variables can be defined inline as well.
  mutation.mutate({ ids: ..., });
  // Since all variables are optional for this Mutation, you can omit the `MarkAlertsReadVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(markAlertsReadVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.updated);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

