package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.request.RequestStatusChangeRequest;
import com.helpinghands.domain.entity.*;
import com.helpinghands.infrastructure.repository.ChildrensHomeRepository;
import com.helpinghands.infrastructure.repository.RequestRepository;
import com.helpinghands.infrastructure.repository.RequestStatusHistoryRepository;
import com.helpinghands.infrastructure.repository.ServiceProviderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RequestServiceTest {

    @Mock private RequestRepository requestRepository;
    @Mock private RequestStatusHistoryRepository historyRepository;
    @Mock private ChildrensHomeRepository childrensHomeRepository;
    @Mock private ServiceProviderRepository serviceProviderRepository;
    @Mock private CurrentUserResolver currentUserResolver;
    @Mock private RatingService ratingService;
    @Mock private AuditLogService auditLogService;
    @Mock private NotificationService notificationService;

    private RequestService requestService;

    private User homeOwnerUser;
    private User donorUser;
    private User providerUser;
    private User adminUser;
    private ChildrensHome home;

    @BeforeEach
    void setUp() {
        requestService = new RequestService(
                requestRepository, historyRepository, childrensHomeRepository,
                serviceProviderRepository, currentUserResolver, ratingService, auditLogService, notificationService);

        homeOwnerUser = userWithRoles(1L, "home_owner", RoleName.CHILDRENS_HOME);
        donorUser = userWithRoles(2L, "donor1", RoleName.DONOR);
        providerUser = userWithRoles(3L, "provider1", RoleName.SERVICE_PROVIDER);
        adminUser = userWithRoles(4L, "admin1", RoleName.ADMINISTRATOR);

        home = new ChildrensHome();
        home.setId(100L);
        home.setUser(homeOwnerUser);
        home.setHomeName("Sunshine Home");
        home.setVerificationStatus(VerificationStatus.APPROVED);

        // save() just echoes back whatever was passed, like a real repository would
        // for an already-managed entity with no DB-generated fields left to fill.
        lenient().when(requestRepository.save(any(Request.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(ratingService.isUserRestricted(any())).thenReturn(false);
    }

    private User userWithRoles(Long id, String username, RoleName... roleNames) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        Set<Role> roles = new java.util.HashSet<>();
        for (RoleName rn : roleNames) {
            Role role = new Role();
            role.setName(rn);
            roles.add(role);
        }
        user.setRoles(roles);
        return user;
    }

    private Request goodsRequest(RequestStatus status) {
        Request request = new Request();
        request.setId(500L);
        request.setChildrensHome(home);
        request.setRequestType(RequestType.GOODS);
        request.setGoodsCategory(GoodsCategory.FOOD);
        request.setTitle("Rice and lentils");
        request.setUrgency(UrgencyLevel.MEDIUM);
        request.setStatus(status);
        return request;
    }

    private Request serviceRequest(RequestStatus status) {
        Request request = new Request();
        request.setId(501L);
        request.setChildrensHome(home);
        request.setRequestType(RequestType.SERVICE);
        request.setServiceCategory(ServiceCategory.TUITION);
        request.setTitle("Weekend maths tutoring");
        request.setUrgency(UrgencyLevel.MEDIUM);
        request.setStatus(status);
        return request;
    }

    // ---- Pledge eligibility ----

    @Test
    void donor_canPledge_toOpenGoodsRequest() {
        Request request = goodsRequest(RequestStatus.CREATED);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(donorUser);

        var result = requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.PLEDGED, null));

        assertEquals(RequestStatus.PLEDGED, result.status());
        assertEquals("donor1", result.pledgedByUsername());
    }

    @Test
    void owningHome_cannotPledge_toItsOwnRequest() {
        Request request = goodsRequest(RequestStatus.CREATED);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(homeOwnerUser);

        ApiException ex = assertThrows(ApiException.class, () ->
                requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.PLEDGED, null)));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void serviceProvider_withUnapprovedProfile_cannotPledge_toServiceRequest() {
        Request request = serviceRequest(RequestStatus.CREATED);
        when(requestRepository.findById(501L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(providerUser);

        ServiceProvider unapprovedProfile = new ServiceProvider();
        unapprovedProfile.setVerificationStatus(VerificationStatus.SUBMITTED);
        unapprovedProfile.setPoliceClearanceRequired(false);
        when(serviceProviderRepository.findByUserId(providerUser.getId())).thenReturn(Optional.of(unapprovedProfile));

        assertThrows(ApiException.class, () ->
                requestService.changeStatus(501L, new RequestStatusChangeRequest(RequestStatus.PLEDGED, null)));
    }

    @Test
    void serviceProvider_withApprovedProfile_canPledge_toServiceRequest() {
        Request request = serviceRequest(RequestStatus.CREATED);
        when(requestRepository.findById(501L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(providerUser);

        ServiceProvider approvedProfile = new ServiceProvider();
        approvedProfile.setVerificationStatus(VerificationStatus.APPROVED);
        approvedProfile.setPoliceClearanceRequired(false);
        when(serviceProviderRepository.findByUserId(providerUser.getId())).thenReturn(Optional.of(approvedProfile));

        var result = requestService.changeStatus(501L, new RequestStatusChangeRequest(RequestStatus.PLEDGED, null));
        assertEquals(RequestStatus.PLEDGED, result.status());
    }

    @Test
    void lowReputationUser_cannotPledge() {
        Request request = goodsRequest(RequestStatus.CREATED);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(donorUser);
        when(ratingService.isUserRestricted(donorUser.getId())).thenReturn(true);

        assertThrows(ApiException.class, () ->
                requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.PLEDGED, null)));
    }

    // ---- Legal transition table ----

    @Test
    void cannotSkipStatesInTheLifecycle() {
        Request request = goodsRequest(RequestStatus.CREATED);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(homeOwnerUser);

        ApiException ex = assertThrows(ApiException.class, () ->
                requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.COMPLETED, null)));
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void owningHome_canAcceptAPledge() {
        Request request = goodsRequest(RequestStatus.PLEDGED);
        request.setPledgedBy(donorUser);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(homeOwnerUser);

        var result = requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.ACCEPTED, null));
        assertEquals(RequestStatus.ACCEPTED, result.status());
    }

    @Test
    void normalUsers_cannotCancelFromInProgress() {
        Request request = goodsRequest(RequestStatus.IN_PROGRESS);
        request.setPledgedBy(donorUser);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(homeOwnerUser);

        assertThrows(ApiException.class, () ->
                requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.CANCELLED, "changed my mind")));
    }

    @Test
    void admin_canCancelFromInProgress_asDisputeResolutionOverride() {
        Request request = goodsRequest(RequestStatus.IN_PROGRESS);
        request.setPledgedBy(donorUser);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(adminUser);

        var result = requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.CANCELLED, "dispute resolved in favor of cancellation"));
        assertEquals(RequestStatus.CANCELLED, result.status());
    }

    @Test
    void pledgedUser_canMarkDelivered() {
        Request request = goodsRequest(RequestStatus.IN_PROGRESS);
        request.setPledgedBy(donorUser);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(donorUser);

        var result = requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.DELIVERED, null));
        assertEquals(RequestStatus.DELIVERED, result.status());
    }

    @Test
    void onlyOwningHome_canConfirmCompletion_notThePledgedDonor() {
        Request request = goodsRequest(RequestStatus.DELIVERED);
        request.setPledgedBy(donorUser);
        when(requestRepository.findById(500L)).thenReturn(Optional.of(request));
        when(currentUserResolver.getCurrentUser()).thenReturn(donorUser);

        assertThrows(ApiException.class, () ->
                requestService.changeStatus(500L, new RequestStatusChangeRequest(RequestStatus.COMPLETED, null)));
    }
}
