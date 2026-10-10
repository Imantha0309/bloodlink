# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateEmergencyRequest, useCreateEmergencyRequestAsUser, useUpdateRequestStatus, useRegisterUser, useUpdateDonorProfile, useUpdateRecipientDistrict, useRespondToRequest, useUpdateDonorResponse, useDeleteDonorResponse, useSetDonorAvailability } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateEmergencyRequest(createEmergencyRequestVars);

const { data, isPending, isSuccess, isError, error } = useCreateEmergencyRequestAsUser(createEmergencyRequestAsUserVars);

const { data, isPending, isSuccess, isError, error } = useUpdateRequestStatus(updateRequestStatusVars);

const { data, isPending, isSuccess, isError, error } = useRegisterUser(registerUserVars);

const { data, isPending, isSuccess, isError, error } = useUpdateDonorProfile(updateDonorProfileVars);

const { data, isPending, isSuccess, isError, error } = useUpdateRecipientDistrict(updateRecipientDistrictVars);

const { data, isPending, isSuccess, isError, error } = useRespondToRequest(respondToRequestVars);

const { data, isPending, isSuccess, isError, error } = useUpdateDonorResponse(updateDonorResponseVars);

const { data, isPending, isSuccess, isError, error } = useDeleteDonorResponse(deleteDonorResponseVars);

const { data, isPending, isSuccess, isError, error } = useSetDonorAvailability(setDonorAvailabilityVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createEmergencyRequest, createEmergencyRequestAsUser, updateRequestStatus, registerUser, updateDonorProfile, updateRecipientDistrict, respondToRequest, updateDonorResponse, deleteDonorResponse, setDonorAvailability } from '@dataconnect/generated';


// Operation CreateEmergencyRequest:  For variables, look at type CreateEmergencyRequestVars in ../index.d.ts
const { data } = await CreateEmergencyRequest(dataConnect, createEmergencyRequestVars);

// Operation CreateEmergencyRequestAsUser:  For variables, look at type CreateEmergencyRequestAsUserVars in ../index.d.ts
const { data } = await CreateEmergencyRequestAsUser(dataConnect, createEmergencyRequestAsUserVars);

// Operation UpdateRequestStatus:  For variables, look at type UpdateRequestStatusVars in ../index.d.ts
const { data } = await UpdateRequestStatus(dataConnect, updateRequestStatusVars);

// Operation RegisterUser:  For variables, look at type RegisterUserVars in ../index.d.ts
const { data } = await RegisterUser(dataConnect, registerUserVars);

// Operation UpdateDonorProfile:  For variables, look at type UpdateDonorProfileVars in ../index.d.ts
const { data } = await UpdateDonorProfile(dataConnect, updateDonorProfileVars);

// Operation UpdateRecipientDistrict:  For variables, look at type UpdateRecipientDistrictVars in ../index.d.ts
const { data } = await UpdateRecipientDistrict(dataConnect, updateRecipientDistrictVars);

// Operation RespondToRequest:  For variables, look at type RespondToRequestVars in ../index.d.ts
const { data } = await RespondToRequest(dataConnect, respondToRequestVars);

// Operation UpdateDonorResponse:  For variables, look at type UpdateDonorResponseVars in ../index.d.ts
const { data } = await UpdateDonorResponse(dataConnect, updateDonorResponseVars);

// Operation DeleteDonorResponse:  For variables, look at type DeleteDonorResponseVars in ../index.d.ts
const { data } = await DeleteDonorResponse(dataConnect, deleteDonorResponseVars);

// Operation SetDonorAvailability:  For variables, look at type SetDonorAvailabilityVars in ../index.d.ts
const { data } = await SetDonorAvailability(dataConnect, setDonorAvailabilityVars);


```