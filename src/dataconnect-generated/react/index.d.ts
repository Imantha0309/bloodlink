import { CreateEmergencyRequestData, CreateEmergencyRequestVariables, CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables, UpdateRequestStatusData, UpdateRequestStatusVariables, RegisterUserData, RegisterUserVariables, UpdateDonorProfileData, UpdateDonorProfileVariables, UpdateRecipientDistrictData, UpdateRecipientDistrictVariables, RespondToRequestData, RespondToRequestVariables, UpdateDonorResponseData, UpdateDonorResponseVariables, DeleteDonorResponseData, DeleteDonorResponseVariables, SetDonorAvailabilityData, SetDonorAvailabilityVariables, DeleteDonorAvailabilityData, StartDonorTransitData, StartDonorTransitVariables, CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables, VerifyDonorCheckInData, VerifyDonorCheckInVariables, SubmitScreeningData, SubmitScreeningVariables, StartExtractionData, StartExtractionVariables, CompleteExtractionData, CompleteExtractionVariables, CompleteDonationCaseData, CompleteDonationCaseVariables, UpdateInventoryItemData, UpdateInventoryItemVariables, MarkAlertsReadData, MarkAlertsReadVariables, GetMeData, ListBloodBanksData, GetBloodBankData, GetBloodBankVariables, GetActiveDonorStatsData, GetEmergencyRequestData, GetEmergencyRequestVariables, ListMyRequestsData, ListDonorFeedData, ListTriageQueueData, ListDonorCommitmentsData, ListDonorResponsesData, GetDonorAvailabilityData, SearchDonorDirectoryData, SearchDonorDirectoryVariables, GetHospitalInventoryData, GetRequestCandidatesData, GetRequestCandidatesVariables, GetRequestWorkflowData, GetRequestWorkflowVariables, GetDonorCommitmentData, GetDonorCommitmentVariables, ListAlertsData, GetDashboardSummaryData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateEmergencyRequest(options?: useDataConnectMutationOptions<CreateEmergencyRequestData, FirebaseError, CreateEmergencyRequestVariables>): UseDataConnectMutationResult<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;
export function useCreateEmergencyRequest(dc: DataConnect, options?: useDataConnectMutationOptions<CreateEmergencyRequestData, FirebaseError, CreateEmergencyRequestVariables>): UseDataConnectMutationResult<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;

export function useCreateEmergencyRequestAsUser(options?: useDataConnectMutationOptions<CreateEmergencyRequestAsUserData, FirebaseError, CreateEmergencyRequestAsUserVariables>): UseDataConnectMutationResult<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;
export function useCreateEmergencyRequestAsUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateEmergencyRequestAsUserData, FirebaseError, CreateEmergencyRequestAsUserVariables>): UseDataConnectMutationResult<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;

export function useUpdateRequestStatus(options?: useDataConnectMutationOptions<UpdateRequestStatusData, FirebaseError, UpdateRequestStatusVariables>): UseDataConnectMutationResult<UpdateRequestStatusData, UpdateRequestStatusVariables>;
export function useUpdateRequestStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateRequestStatusData, FirebaseError, UpdateRequestStatusVariables>): UseDataConnectMutationResult<UpdateRequestStatusData, UpdateRequestStatusVariables>;

export function useRegisterUser(options?: useDataConnectMutationOptions<RegisterUserData, FirebaseError, RegisterUserVariables>): UseDataConnectMutationResult<RegisterUserData, RegisterUserVariables>;
export function useRegisterUser(dc: DataConnect, options?: useDataConnectMutationOptions<RegisterUserData, FirebaseError, RegisterUserVariables>): UseDataConnectMutationResult<RegisterUserData, RegisterUserVariables>;

export function useUpdateDonorProfile(options?: useDataConnectMutationOptions<UpdateDonorProfileData, FirebaseError, UpdateDonorProfileVariables>): UseDataConnectMutationResult<UpdateDonorProfileData, UpdateDonorProfileVariables>;
export function useUpdateDonorProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateDonorProfileData, FirebaseError, UpdateDonorProfileVariables>): UseDataConnectMutationResult<UpdateDonorProfileData, UpdateDonorProfileVariables>;

export function useUpdateRecipientDistrict(options?: useDataConnectMutationOptions<UpdateRecipientDistrictData, FirebaseError, UpdateRecipientDistrictVariables | void>): UseDataConnectMutationResult<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;
export function useUpdateRecipientDistrict(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateRecipientDistrictData, FirebaseError, UpdateRecipientDistrictVariables | void>): UseDataConnectMutationResult<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;

export function useRespondToRequest(options?: useDataConnectMutationOptions<RespondToRequestData, FirebaseError, RespondToRequestVariables>): UseDataConnectMutationResult<RespondToRequestData, RespondToRequestVariables>;
export function useRespondToRequest(dc: DataConnect, options?: useDataConnectMutationOptions<RespondToRequestData, FirebaseError, RespondToRequestVariables>): UseDataConnectMutationResult<RespondToRequestData, RespondToRequestVariables>;

export function useUpdateDonorResponse(options?: useDataConnectMutationOptions<UpdateDonorResponseData, FirebaseError, UpdateDonorResponseVariables>): UseDataConnectMutationResult<UpdateDonorResponseData, UpdateDonorResponseVariables>;
export function useUpdateDonorResponse(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateDonorResponseData, FirebaseError, UpdateDonorResponseVariables>): UseDataConnectMutationResult<UpdateDonorResponseData, UpdateDonorResponseVariables>;

export function useDeleteDonorResponse(options?: useDataConnectMutationOptions<DeleteDonorResponseData, FirebaseError, DeleteDonorResponseVariables>): UseDataConnectMutationResult<DeleteDonorResponseData, DeleteDonorResponseVariables>;
export function useDeleteDonorResponse(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteDonorResponseData, FirebaseError, DeleteDonorResponseVariables>): UseDataConnectMutationResult<DeleteDonorResponseData, DeleteDonorResponseVariables>;

export function useSetDonorAvailability(options?: useDataConnectMutationOptions<SetDonorAvailabilityData, FirebaseError, SetDonorAvailabilityVariables>): UseDataConnectMutationResult<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;
export function useSetDonorAvailability(dc: DataConnect, options?: useDataConnectMutationOptions<SetDonorAvailabilityData, FirebaseError, SetDonorAvailabilityVariables>): UseDataConnectMutationResult<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;

export function useDeleteDonorAvailability(options?: useDataConnectMutationOptions<DeleteDonorAvailabilityData, FirebaseError, void>): UseDataConnectMutationResult<DeleteDonorAvailabilityData, undefined>;
export function useDeleteDonorAvailability(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteDonorAvailabilityData, FirebaseError, void>): UseDataConnectMutationResult<DeleteDonorAvailabilityData, undefined>;

export function useStartDonorTransit(options?: useDataConnectMutationOptions<StartDonorTransitData, FirebaseError, StartDonorTransitVariables>): UseDataConnectMutationResult<StartDonorTransitData, StartDonorTransitVariables>;
export function useStartDonorTransit(dc: DataConnect, options?: useDataConnectMutationOptions<StartDonorTransitData, FirebaseError, StartDonorTransitVariables>): UseDataConnectMutationResult<StartDonorTransitData, StartDonorTransitVariables>;

export function useCreateDonorCheckInTicket(options?: useDataConnectMutationOptions<CreateDonorCheckInTicketData, FirebaseError, CreateDonorCheckInTicketVariables>): UseDataConnectMutationResult<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;
export function useCreateDonorCheckInTicket(dc: DataConnect, options?: useDataConnectMutationOptions<CreateDonorCheckInTicketData, FirebaseError, CreateDonorCheckInTicketVariables>): UseDataConnectMutationResult<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;

export function useVerifyDonorCheckIn(options?: useDataConnectMutationOptions<VerifyDonorCheckInData, FirebaseError, VerifyDonorCheckInVariables>): UseDataConnectMutationResult<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;
export function useVerifyDonorCheckIn(dc: DataConnect, options?: useDataConnectMutationOptions<VerifyDonorCheckInData, FirebaseError, VerifyDonorCheckInVariables>): UseDataConnectMutationResult<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;

export function useSubmitScreening(options?: useDataConnectMutationOptions<SubmitScreeningData, FirebaseError, SubmitScreeningVariables>): UseDataConnectMutationResult<SubmitScreeningData, SubmitScreeningVariables>;
export function useSubmitScreening(dc: DataConnect, options?: useDataConnectMutationOptions<SubmitScreeningData, FirebaseError, SubmitScreeningVariables>): UseDataConnectMutationResult<SubmitScreeningData, SubmitScreeningVariables>;

export function useStartExtraction(options?: useDataConnectMutationOptions<StartExtractionData, FirebaseError, StartExtractionVariables>): UseDataConnectMutationResult<StartExtractionData, StartExtractionVariables>;
export function useStartExtraction(dc: DataConnect, options?: useDataConnectMutationOptions<StartExtractionData, FirebaseError, StartExtractionVariables>): UseDataConnectMutationResult<StartExtractionData, StartExtractionVariables>;

export function useCompleteExtraction(options?: useDataConnectMutationOptions<CompleteExtractionData, FirebaseError, CompleteExtractionVariables>): UseDataConnectMutationResult<CompleteExtractionData, CompleteExtractionVariables>;
export function useCompleteExtraction(dc: DataConnect, options?: useDataConnectMutationOptions<CompleteExtractionData, FirebaseError, CompleteExtractionVariables>): UseDataConnectMutationResult<CompleteExtractionData, CompleteExtractionVariables>;

export function useCompleteDonationCase(options?: useDataConnectMutationOptions<CompleteDonationCaseData, FirebaseError, CompleteDonationCaseVariables>): UseDataConnectMutationResult<CompleteDonationCaseData, CompleteDonationCaseVariables>;
export function useCompleteDonationCase(dc: DataConnect, options?: useDataConnectMutationOptions<CompleteDonationCaseData, FirebaseError, CompleteDonationCaseVariables>): UseDataConnectMutationResult<CompleteDonationCaseData, CompleteDonationCaseVariables>;

export function useUpdateInventoryItem(options?: useDataConnectMutationOptions<UpdateInventoryItemData, FirebaseError, UpdateInventoryItemVariables>): UseDataConnectMutationResult<UpdateInventoryItemData, UpdateInventoryItemVariables>;
export function useUpdateInventoryItem(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateInventoryItemData, FirebaseError, UpdateInventoryItemVariables>): UseDataConnectMutationResult<UpdateInventoryItemData, UpdateInventoryItemVariables>;

export function useMarkAlertsRead(options?: useDataConnectMutationOptions<MarkAlertsReadData, FirebaseError, MarkAlertsReadVariables | void>): UseDataConnectMutationResult<MarkAlertsReadData, MarkAlertsReadVariables>;
export function useMarkAlertsRead(dc: DataConnect, options?: useDataConnectMutationOptions<MarkAlertsReadData, FirebaseError, MarkAlertsReadVariables | void>): UseDataConnectMutationResult<MarkAlertsReadData, MarkAlertsReadVariables>;

export function useGetMe(options?: useDataConnectQueryOptions<GetMeData>): UseDataConnectQueryResult<GetMeData, undefined>;
export function useGetMe(dc: DataConnect, options?: useDataConnectQueryOptions<GetMeData>): UseDataConnectQueryResult<GetMeData, undefined>;

export function useListBloodBanks(options?: useDataConnectQueryOptions<ListBloodBanksData>): UseDataConnectQueryResult<ListBloodBanksData, undefined>;
export function useListBloodBanks(dc: DataConnect, options?: useDataConnectQueryOptions<ListBloodBanksData>): UseDataConnectQueryResult<ListBloodBanksData, undefined>;

export function useGetBloodBank(vars: GetBloodBankVariables, options?: useDataConnectQueryOptions<GetBloodBankData>): UseDataConnectQueryResult<GetBloodBankData, GetBloodBankVariables>;
export function useGetBloodBank(dc: DataConnect, vars: GetBloodBankVariables, options?: useDataConnectQueryOptions<GetBloodBankData>): UseDataConnectQueryResult<GetBloodBankData, GetBloodBankVariables>;

export function useGetActiveDonorStats(options?: useDataConnectQueryOptions<GetActiveDonorStatsData>): UseDataConnectQueryResult<GetActiveDonorStatsData, undefined>;
export function useGetActiveDonorStats(dc: DataConnect, options?: useDataConnectQueryOptions<GetActiveDonorStatsData>): UseDataConnectQueryResult<GetActiveDonorStatsData, undefined>;

export function useGetEmergencyRequest(vars: GetEmergencyRequestVariables, options?: useDataConnectQueryOptions<GetEmergencyRequestData>): UseDataConnectQueryResult<GetEmergencyRequestData, GetEmergencyRequestVariables>;
export function useGetEmergencyRequest(dc: DataConnect, vars: GetEmergencyRequestVariables, options?: useDataConnectQueryOptions<GetEmergencyRequestData>): UseDataConnectQueryResult<GetEmergencyRequestData, GetEmergencyRequestVariables>;

export function useListMyRequests(options?: useDataConnectQueryOptions<ListMyRequestsData>): UseDataConnectQueryResult<ListMyRequestsData, undefined>;
export function useListMyRequests(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyRequestsData>): UseDataConnectQueryResult<ListMyRequestsData, undefined>;

export function useListDonorFeed(options?: useDataConnectQueryOptions<ListDonorFeedData>): UseDataConnectQueryResult<ListDonorFeedData, undefined>;
export function useListDonorFeed(dc: DataConnect, options?: useDataConnectQueryOptions<ListDonorFeedData>): UseDataConnectQueryResult<ListDonorFeedData, undefined>;

export function useListTriageQueue(options?: useDataConnectQueryOptions<ListTriageQueueData>): UseDataConnectQueryResult<ListTriageQueueData, undefined>;
export function useListTriageQueue(dc: DataConnect, options?: useDataConnectQueryOptions<ListTriageQueueData>): UseDataConnectQueryResult<ListTriageQueueData, undefined>;

export function useListDonorCommitments(options?: useDataConnectQueryOptions<ListDonorCommitmentsData>): UseDataConnectQueryResult<ListDonorCommitmentsData, undefined>;
export function useListDonorCommitments(dc: DataConnect, options?: useDataConnectQueryOptions<ListDonorCommitmentsData>): UseDataConnectQueryResult<ListDonorCommitmentsData, undefined>;

export function useListDonorResponses(options?: useDataConnectQueryOptions<ListDonorResponsesData>): UseDataConnectQueryResult<ListDonorResponsesData, undefined>;
export function useListDonorResponses(dc: DataConnect, options?: useDataConnectQueryOptions<ListDonorResponsesData>): UseDataConnectQueryResult<ListDonorResponsesData, undefined>;

export function useGetDonorAvailability(options?: useDataConnectQueryOptions<GetDonorAvailabilityData>): UseDataConnectQueryResult<GetDonorAvailabilityData, undefined>;
export function useGetDonorAvailability(dc: DataConnect, options?: useDataConnectQueryOptions<GetDonorAvailabilityData>): UseDataConnectQueryResult<GetDonorAvailabilityData, undefined>;

export function useSearchDonorDirectory(vars?: SearchDonorDirectoryVariables, options?: useDataConnectQueryOptions<SearchDonorDirectoryData>): UseDataConnectQueryResult<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;
export function useSearchDonorDirectory(dc: DataConnect, vars?: SearchDonorDirectoryVariables, options?: useDataConnectQueryOptions<SearchDonorDirectoryData>): UseDataConnectQueryResult<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;

export function useGetHospitalInventory(options?: useDataConnectQueryOptions<GetHospitalInventoryData>): UseDataConnectQueryResult<GetHospitalInventoryData, undefined>;
export function useGetHospitalInventory(dc: DataConnect, options?: useDataConnectQueryOptions<GetHospitalInventoryData>): UseDataConnectQueryResult<GetHospitalInventoryData, undefined>;

export function useGetRequestCandidates(vars: GetRequestCandidatesVariables, options?: useDataConnectQueryOptions<GetRequestCandidatesData>): UseDataConnectQueryResult<GetRequestCandidatesData, GetRequestCandidatesVariables>;
export function useGetRequestCandidates(dc: DataConnect, vars: GetRequestCandidatesVariables, options?: useDataConnectQueryOptions<GetRequestCandidatesData>): UseDataConnectQueryResult<GetRequestCandidatesData, GetRequestCandidatesVariables>;

export function useGetRequestWorkflow(vars: GetRequestWorkflowVariables, options?: useDataConnectQueryOptions<GetRequestWorkflowData>): UseDataConnectQueryResult<GetRequestWorkflowData, GetRequestWorkflowVariables>;
export function useGetRequestWorkflow(dc: DataConnect, vars: GetRequestWorkflowVariables, options?: useDataConnectQueryOptions<GetRequestWorkflowData>): UseDataConnectQueryResult<GetRequestWorkflowData, GetRequestWorkflowVariables>;

export function useGetDonorCommitment(vars: GetDonorCommitmentVariables, options?: useDataConnectQueryOptions<GetDonorCommitmentData>): UseDataConnectQueryResult<GetDonorCommitmentData, GetDonorCommitmentVariables>;
export function useGetDonorCommitment(dc: DataConnect, vars: GetDonorCommitmentVariables, options?: useDataConnectQueryOptions<GetDonorCommitmentData>): UseDataConnectQueryResult<GetDonorCommitmentData, GetDonorCommitmentVariables>;

export function useListAlerts(options?: useDataConnectQueryOptions<ListAlertsData>): UseDataConnectQueryResult<ListAlertsData, undefined>;
export function useListAlerts(dc: DataConnect, options?: useDataConnectQueryOptions<ListAlertsData>): UseDataConnectQueryResult<ListAlertsData, undefined>;

export function useGetDashboardSummary(options?: useDataConnectQueryOptions<GetDashboardSummaryData>): UseDataConnectQueryResult<GetDashboardSummaryData, undefined>;
export function useGetDashboardSummary(dc: DataConnect, options?: useDataConnectQueryOptions<GetDashboardSummaryData>): UseDataConnectQueryResult<GetDashboardSummaryData, undefined>;
