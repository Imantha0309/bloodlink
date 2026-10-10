const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const BloodComponent = {
  whole_blood: "whole_blood",
  prbc: "prbc",
  platelets: "platelets",
  plasma: "plasma",
}
exports.BloodComponent = BloodComponent;

const DonorResponse = {
  accepted: "accepted",
  declined: "declined",
}
exports.DonorResponse = DonorResponse;

const RequestStatus = {
  pending: "pending",
  verified: "verified",
  fulfilled: "fulfilled",
  cancelled: "cancelled",
}
exports.RequestStatus = RequestStatus;

const UrgencyLevel = {
  critical: "critical",
  urgent: "urgent",
  standard: "standard",
}
exports.UrgencyLevel = UrgencyLevel;

const UserRole = {
  recipient: "recipient",
  donor: "donor",
  hospital: "hospital",
  admin: "admin",
}
exports.UserRole = UserRole;

const connectorConfig = {
  connector: 'default',
  service: 'bloodlink-c75d7-service',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const createEmergencyRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEmergencyRequest', inputVars);
}
createEmergencyRequestRef.operationName = 'CreateEmergencyRequest';
exports.createEmergencyRequestRef = createEmergencyRequestRef;

exports.createEmergencyRequest = function createEmergencyRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createEmergencyRequestRef(dcInstance, inputVars));
}
;

const createEmergencyRequestAsUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEmergencyRequestAsUser', inputVars);
}
createEmergencyRequestAsUserRef.operationName = 'CreateEmergencyRequestAsUser';
exports.createEmergencyRequestAsUserRef = createEmergencyRequestAsUserRef;

exports.createEmergencyRequestAsUser = function createEmergencyRequestAsUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createEmergencyRequestAsUserRef(dcInstance, inputVars));
}
;

const updateRequestStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRequestStatus', inputVars);
}
updateRequestStatusRef.operationName = 'UpdateRequestStatus';
exports.updateRequestStatusRef = updateRequestStatusRef;

exports.updateRequestStatus = function updateRequestStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateRequestStatusRef(dcInstance, inputVars));
}
;

const registerUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegisterUser', inputVars);
}
registerUserRef.operationName = 'RegisterUser';
exports.registerUserRef = registerUserRef;

exports.registerUser = function registerUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(registerUserRef(dcInstance, inputVars));
}
;

const updateDonorProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateDonorProfile', inputVars);
}
updateDonorProfileRef.operationName = 'UpdateDonorProfile';
exports.updateDonorProfileRef = updateDonorProfileRef;

exports.updateDonorProfile = function updateDonorProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateDonorProfileRef(dcInstance, inputVars));
}
;

const updateRecipientDistrictRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRecipientDistrict', inputVars);
}
updateRecipientDistrictRef.operationName = 'UpdateRecipientDistrict';
exports.updateRecipientDistrictRef = updateRecipientDistrictRef;

exports.updateRecipientDistrict = function updateRecipientDistrict(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars);
  return executeMutation(updateRecipientDistrictRef(dcInstance, inputVars));
}
;

const respondToRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RespondToRequest', inputVars);
}
respondToRequestRef.operationName = 'RespondToRequest';
exports.respondToRequestRef = respondToRequestRef;

exports.respondToRequest = function respondToRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(respondToRequestRef(dcInstance, inputVars));
}
;

const updateDonorResponseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateDonorResponse', inputVars);
}
updateDonorResponseRef.operationName = 'UpdateDonorResponse';
exports.updateDonorResponseRef = updateDonorResponseRef;

exports.updateDonorResponse = function updateDonorResponse(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateDonorResponseRef(dcInstance, inputVars));
}
;

const deleteDonorResponseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteDonorResponse', inputVars);
}
deleteDonorResponseRef.operationName = 'DeleteDonorResponse';
exports.deleteDonorResponseRef = deleteDonorResponseRef;

exports.deleteDonorResponse = function deleteDonorResponse(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteDonorResponseRef(dcInstance, inputVars));
}
;

const setDonorAvailabilityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetDonorAvailability', inputVars);
}
setDonorAvailabilityRef.operationName = 'SetDonorAvailability';
exports.setDonorAvailabilityRef = setDonorAvailabilityRef;

exports.setDonorAvailability = function setDonorAvailability(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setDonorAvailabilityRef(dcInstance, inputVars));
}
;

const deleteDonorAvailabilityRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteDonorAvailability');
}
deleteDonorAvailabilityRef.operationName = 'DeleteDonorAvailability';
exports.deleteDonorAvailabilityRef = deleteDonorAvailabilityRef;

exports.deleteDonorAvailability = function deleteDonorAvailability(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(deleteDonorAvailabilityRef(dcInstance, inputVars));
}
;

const startDonorTransitRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'StartDonorTransit', inputVars);
}
startDonorTransitRef.operationName = 'StartDonorTransit';
exports.startDonorTransitRef = startDonorTransitRef;

exports.startDonorTransit = function startDonorTransit(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(startDonorTransitRef(dcInstance, inputVars));
}
;

const createDonorCheckInTicketRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateDonorCheckInTicket', inputVars);
}
createDonorCheckInTicketRef.operationName = 'CreateDonorCheckInTicket';
exports.createDonorCheckInTicketRef = createDonorCheckInTicketRef;

exports.createDonorCheckInTicket = function createDonorCheckInTicket(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createDonorCheckInTicketRef(dcInstance, inputVars));
}
;

const verifyDonorCheckInRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'VerifyDonorCheckIn', inputVars);
}
verifyDonorCheckInRef.operationName = 'VerifyDonorCheckIn';
exports.verifyDonorCheckInRef = verifyDonorCheckInRef;

exports.verifyDonorCheckIn = function verifyDonorCheckIn(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(verifyDonorCheckInRef(dcInstance, inputVars));
}
;

const submitScreeningRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SubmitScreening', inputVars);
}
submitScreeningRef.operationName = 'SubmitScreening';
exports.submitScreeningRef = submitScreeningRef;

exports.submitScreening = function submitScreening(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(submitScreeningRef(dcInstance, inputVars));
}
;

const startExtractionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'StartExtraction', inputVars);
}
startExtractionRef.operationName = 'StartExtraction';
exports.startExtractionRef = startExtractionRef;

exports.startExtraction = function startExtraction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(startExtractionRef(dcInstance, inputVars));
}
;

const completeExtractionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CompleteExtraction', inputVars);
}
completeExtractionRef.operationName = 'CompleteExtraction';
exports.completeExtractionRef = completeExtractionRef;

exports.completeExtraction = function completeExtraction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(completeExtractionRef(dcInstance, inputVars));
}
;

const completeDonationCaseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CompleteDonationCase', inputVars);
}
completeDonationCaseRef.operationName = 'CompleteDonationCase';
exports.completeDonationCaseRef = completeDonationCaseRef;

exports.completeDonationCase = function completeDonationCase(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(completeDonationCaseRef(dcInstance, inputVars));
}
;

const updateInventoryItemRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInventoryItem', inputVars);
}
updateInventoryItemRef.operationName = 'UpdateInventoryItem';
exports.updateInventoryItemRef = updateInventoryItemRef;

exports.updateInventoryItem = function updateInventoryItem(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateInventoryItemRef(dcInstance, inputVars));
}
;

const updatePushTokenRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdatePushToken', inputVars);
}
updatePushTokenRef.operationName = 'UpdatePushToken';
exports.updatePushTokenRef = updatePushTokenRef;

exports.updatePushToken = function updatePushToken(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updatePushTokenRef(dcInstance, inputVars));
}
;

const markAlertsReadRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkAlertsRead', inputVars);
}
markAlertsReadRef.operationName = 'MarkAlertsRead';
exports.markAlertsReadRef = markAlertsReadRef;

exports.markAlertsRead = function markAlertsRead(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars);
  return executeMutation(markAlertsReadRef(dcInstance, inputVars));
}
;

const getMeRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMe');
}
getMeRef.operationName = 'GetMe';
exports.getMeRef = getMeRef;

exports.getMe = function getMe(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMeRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listBloodBanksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBloodBanks');
}
listBloodBanksRef.operationName = 'ListBloodBanks';
exports.listBloodBanksRef = listBloodBanksRef;

exports.listBloodBanks = function listBloodBanks(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listBloodBanksRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getBloodBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBloodBank', inputVars);
}
getBloodBankRef.operationName = 'GetBloodBank';
exports.getBloodBankRef = getBloodBankRef;

exports.getBloodBank = function getBloodBank(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getBloodBankRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getActiveDonorStatsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetActiveDonorStats');
}
getActiveDonorStatsRef.operationName = 'GetActiveDonorStats';
exports.getActiveDonorStatsRef = getActiveDonorStatsRef;

exports.getActiveDonorStats = function getActiveDonorStats(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getActiveDonorStatsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getEmergencyRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetEmergencyRequest', inputVars);
}
getEmergencyRequestRef.operationName = 'GetEmergencyRequest';
exports.getEmergencyRequestRef = getEmergencyRequestRef;

exports.getEmergencyRequest = function getEmergencyRequest(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getEmergencyRequestRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listMyRequestsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRequests');
}
listMyRequestsRef.operationName = 'ListMyRequests';
exports.listMyRequestsRef = listMyRequestsRef;

exports.listMyRequests = function listMyRequests(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listMyRequestsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listDonorFeedRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDonorFeed');
}
listDonorFeedRef.operationName = 'ListDonorFeed';
exports.listDonorFeedRef = listDonorFeedRef;

exports.listDonorFeed = function listDonorFeed(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listDonorFeedRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listTriageQueueRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListTriageQueue');
}
listTriageQueueRef.operationName = 'ListTriageQueue';
exports.listTriageQueueRef = listTriageQueueRef;

exports.listTriageQueue = function listTriageQueue(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listTriageQueueRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listDonorCommitmentsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDonorCommitments');
}
listDonorCommitmentsRef.operationName = 'ListDonorCommitments';
exports.listDonorCommitmentsRef = listDonorCommitmentsRef;

exports.listDonorCommitments = function listDonorCommitments(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listDonorCommitmentsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listDonorResponsesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDonorResponses');
}
listDonorResponsesRef.operationName = 'ListDonorResponses';
exports.listDonorResponsesRef = listDonorResponsesRef;

exports.listDonorResponses = function listDonorResponses(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listDonorResponsesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getDonorAvailabilityRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetDonorAvailability');
}
getDonorAvailabilityRef.operationName = 'GetDonorAvailability';
exports.getDonorAvailabilityRef = getDonorAvailabilityRef;

exports.getDonorAvailability = function getDonorAvailability(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getDonorAvailabilityRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const searchDonorDirectoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchDonorDirectory', inputVars);
}
searchDonorDirectoryRef.operationName = 'SearchDonorDirectory';
exports.searchDonorDirectoryRef = searchDonorDirectoryRef;

exports.searchDonorDirectory = function searchDonorDirectory(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(searchDonorDirectoryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getHospitalInventoryRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetHospitalInventory');
}
getHospitalInventoryRef.operationName = 'GetHospitalInventory';
exports.getHospitalInventoryRef = getHospitalInventoryRef;

exports.getHospitalInventory = function getHospitalInventory(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getHospitalInventoryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getRequestCandidatesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetRequestCandidates', inputVars);
}
getRequestCandidatesRef.operationName = 'GetRequestCandidates';
exports.getRequestCandidatesRef = getRequestCandidatesRef;

exports.getRequestCandidates = function getRequestCandidates(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getRequestCandidatesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getRequestWorkflowRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetRequestWorkflow', inputVars);
}
getRequestWorkflowRef.operationName = 'GetRequestWorkflow';
exports.getRequestWorkflowRef = getRequestWorkflowRef;

exports.getRequestWorkflow = function getRequestWorkflow(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getRequestWorkflowRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getDonorCommitmentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetDonorCommitment', inputVars);
}
getDonorCommitmentRef.operationName = 'GetDonorCommitment';
exports.getDonorCommitmentRef = getDonorCommitmentRef;

exports.getDonorCommitment = function getDonorCommitment(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getDonorCommitmentRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listAlertsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAlerts');
}
listAlertsRef.operationName = 'ListAlerts';
exports.listAlertsRef = listAlertsRef;

exports.listAlerts = function listAlerts(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAlertsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getDashboardSummaryRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetDashboardSummary');
}
getDashboardSummaryRef.operationName = 'GetDashboardSummary';
exports.getDashboardSummaryRef = getDashboardSummaryRef;

exports.getDashboardSummary = function getDashboardSummary(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getDashboardSummaryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
