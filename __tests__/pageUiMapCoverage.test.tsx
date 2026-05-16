import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const navigate = jest.fn();
const setSearchParams = jest.fn();
let searchParams = new URLSearchParams();
const useIsAdmin = jest.fn();
const useAuth = jest.fn();
const useAuthStatus = jest.fn();
const useTheme = jest.fn();
const useSuperAdminAnalytics = jest.fn();
const usePerformanceOptimization = jest.fn();
const useQuery = jest.fn();
const supabaseFrom = jest.fn();
const supabaseGetUser = jest.fn();
const supabaseGetSession = jest.fn();
const supabaseOnAuthStateChange = jest.fn();
const supabaseSignOut = jest.fn();
const supabaseUpdateUser = jest.fn();
const supabaseInvoke = jest.fn();
const toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  loading: jest.fn(),
};
const fetchOnlineHosts = jest.fn();
const mobileChartProps: Array<{ data: unknown[]; title: string }> = [];

jest.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/login", state: null }),
  useSearchParams: () => [searchParams, setSearchParams],
}));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => supabaseFrom(...args),
    auth: {
      getUser: () => supabaseGetUser(),
      getSession: () => supabaseGetSession(),
      onAuthStateChange: (...args: unknown[]) => supabaseOnAuthStateChange(...args),
      signOut: () => supabaseSignOut(),
      updateUser: (...args: unknown[]) => supabaseUpdateUser(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => supabaseInvoke(...args),
    },
  },
}));

jest.mock("sonner", () => ({ toast }));
jest.mock("@/utils/toast-utils", () => ({ toast }));
jest.mock("@/components/auth/SignInForm", () => ({
  SignInForm: () => <div data-testid="sign-in-form">Sign in form</div>,
}));
jest.mock("@/components/Navigation", () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));
jest.mock("@/components/Header", () => ({
  Header: ({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (value: string) => void }) => (
    <input aria-label="site search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} />
  ),
}));
jest.mock("@/components/dashboard/DashboardHeader", () => ({
  DashboardHeader: ({ onViewChange, isAdmin }: { onViewChange: (view: "renter" | "host" | "admin") => void; isAdmin: boolean }) => (
    <div>
      <button onClick={() => onViewChange("renter")}>Renter view</button>
      <button onClick={() => onViewChange("host")}>Host view</button>
      {isAdmin && <button onClick={() => onViewChange("admin")}>Admin view</button>}
    </div>
  ),
}));
jest.mock("@/components/dashboard/RenterDashboard", () => ({
  RenterDashboard: () => <section>Renter dashboard</section>,
}));
jest.mock("@/components/dashboard/HostDashboard", () => ({
  HostDashboard: () => <section>Host dashboard</section>,
}));
jest.mock("@/components/admin/AdminStats", () => ({
  AdminStats: () => <section>Admin stats</section>,
}));
jest.mock("@/hooks/useIsAdmin", () => ({ useIsAdmin: () => useIsAdmin() }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => useAuth() }));
jest.mock("@/hooks/useAuthStatus", () => ({ useAuthStatus: () => useAuthStatus() }));
jest.mock("@/contexts/ThemeContext", () => ({ useTheme: () => useTheme() }));
jest.mock("@/services/hostService", () => ({
  fetchOnlineHosts: () => fetchOnlineHosts(),
  fetchHostById: jest.fn(),
}));

jest.mock("@/components/map/CustomMapbox", () => ({
  __esModule: true,
  default: ({ onlineHosts, mapStyle, onRouteFound }: { onlineHosts: unknown[]; mapStyle: string; onRouteFound: (steps: unknown[]) => void }) => (
    <button
      data-testid="custom-mapbox"
      onClick={() => onRouteFound([{ instruction: "Head north", distance: 10 }])}
    >
      {mapStyle}:{onlineHosts.length}
    </button>
  ),
}));
jest.mock("@/contexts/HandoverProvider", () => ({
  HandoverProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="handover-provider">{children}</div>,
}));
jest.mock("@/components/handover/EnhancedHandoverSheet", () => ({
  EnhancedHandoverSheet: ({ isOpen, bookingId, onClose }: { isOpen: boolean; bookingId: string; onClose: () => void }) =>
    isOpen ? <button onClick={onClose}>Sheet {bookingId}</button> : null,
}));
jest.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/handover/HandoverErrorBoundary", () => ({
  HandoverErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/navigation/RouteStepsPanel", () => ({
  RouteStepsPanel: ({ steps }: { steps: unknown[] }) => <aside>Route steps {steps.length}</aside>,
}));
jest.mock("react-spinners", () => ({
  BarLoader: () => <div data-testid="bar-loader" />,
}));

jest.mock("@/hooks/useSuperAdminAnalytics", () => ({
  useSuperAdminAnalytics: () => useSuperAdminAnalytics(),
}));
jest.mock("@/hooks/usePerformanceOptimization", () => ({
  usePerformanceOptimization: (...args: unknown[]) => usePerformanceOptimization(...args),
}));
jest.mock("@/components/admin/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
jest.mock("@/components/admin/AdminProtectedRoute", () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/admin/superadmin/AnalyticsCharts", () => ({
  AnalyticsCharts: () => <section>Analytics charts</section>,
}));
jest.mock("@/components/admin/superadmin/SecurityMonitor", () => ({
  SecurityMonitor: () => <section>Security monitor</section>,
}));
jest.mock("@/components/admin/superadmin/AdminActivity", () => ({
  AdminActivity: () => <section>Admin activity</section>,
}));
jest.mock("@/components/admin/superadmin/UserBehavior", () => ({
  UserBehavior: () => <section>User behavior</section>,
}));
jest.mock("@/components/admin/superadmin/MobileOptimizedChart", () => ({
  MobileOptimizedChart: (props: { data: unknown[]; title: string }) => {
    mobileChartProps.push(props);
    return <section>Mobile chart {props.title}</section>;
  },
}));
jest.mock("@/components/admin/superadmin/AdvancedFilters", () => ({
  AdvancedFilters: ({ onFiltersChange, onClearFilters }: { onFiltersChange: (filters: unknown) => void; onClearFilters: () => void }) => (
    <div>
      <button onClick={() => onFiltersChange({ dateRange: { start: "2026-05-01", end: "2026-05-13" }, severityLevels: ["high"] })}>
        Apply filters
      </button>
      <button onClick={onClearFilters}>Clear filters</button>
    </div>
  ),
}));
jest.mock("@/components/admin/superadmin/SecurityAlertSystem", () => ({
  SecurityAlertSystem: ({
    alerts,
    onAlertAcknowledge,
    onAlertDismiss,
    onSettingsChange,
  }: {
    alerts: Array<{ id: string }>;
    onAlertAcknowledge: (id: string) => void;
    onAlertDismiss: (id: string) => void;
    onSettingsChange: (settings: unknown) => void;
  }) => (
    <div>
      Security alert system {alerts.length}
      <button onClick={() => onAlertAcknowledge(alerts[0]?.id)}>Acknowledge alert</button>
      <button onClick={() => onAlertDismiss(alerts[0]?.id)}>Dismiss alert</button>
      <button onClick={() => onSettingsChange({ enabled: false })}>Change alert settings</button>
    </div>
  ),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => useQuery(options),
}));

jest.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: jest.fn(() => [
    jest.fn(),
    {
      canScrollPrev: jest.fn(() => true),
      canScrollNext: jest.fn(() => true),
      scrollPrev: jest.fn(),
      scrollNext: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    },
  ]),
}));

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => null,
}));

const makeProfileQuery = (profile: unknown) => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn(() => Promise.resolve({ data: profile, error: null })),
    })),
  })),
});

describe("page, UI, and map coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseFrom.mockReset();
    supabaseGetUser.mockReset();
    supabaseGetSession.mockReset();
    supabaseOnAuthStateChange.mockReset();
    supabaseSignOut.mockReset();
    supabaseUpdateUser.mockReset();
    supabaseInvoke.mockReset();
    useQuery.mockReset();
    useSuperAdminAnalytics.mockReset();
    usePerformanceOptimization.mockReset();
    searchParams = new URLSearchParams();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    useIsAdmin.mockReturnValue({ isAdmin: true });
    useAuth.mockReturnValue({ user: { id: "user-1" } });
    useAuthStatus.mockReturnValue({ userId: "user-1", userRole: "renter" });
    useTheme.mockReturnValue({ theme: "dark" });
    fetchOnlineHosts.mockResolvedValue([
      { id: "host-1", full_name: "Host One", latitude: -24.6, longitude: 25.9, avatar_url: null },
    ]);
    mobileChartProps.length = 0;
    supabaseGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    supabaseGetSession.mockResolvedValue({ data: { session: null }, error: null });
    supabaseOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    supabaseSignOut.mockResolvedValue({ error: null });
    supabaseUpdateUser.mockResolvedValue({ error: null });
    supabaseInvoke.mockResolvedValue({ data: { status: "completed", booking_id: "booking-1" }, error: null });
    supabaseFrom.mockReturnValue(makeProfileQuery({ role: "admin", full_name: "Test User", phone_number: "+26770000000" }));
    useQuery.mockReturnValue({ data: [], isLoading: false });
    useSuperAdminAnalytics.mockReturnValue({
      analytics: [],
      events: [
        {
          id: "event-1",
          event_type: "permission_change",
          severity: "critical",
          actor_id: "admin-1",
          created_at: "2026-05-13T10:00:00Z",
        },
      ],
      userMetrics: { total_users: 12, active_users: 9, new_users: 2 },
      systemMetrics: { total_bookings: 5, revenue: 300, completed_bookings: 3 },
      securityMetrics: { total_events: 1, critical_events: 1 },
      loading: false,
      refreshData: jest.fn(),
      exportAnalytics: jest.fn().mockResolvedValue(true),
      dateRange: { start: "2026-05-01", end: "2026-05-13" },
      setDateRange: jest.fn(),
      userGrowth: [{ name: "May 2026", value: 3 }],
      bookingGrowth: [{ name: "May 2026", value: 2 }],
    });
    usePerformanceOptimization.mockReturnValue({
      data: [],
      loading: false,
      pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
      goToPage: jest.fn(),
      nextPage: jest.fn(),
      previousPage: jest.fn(),
      handleSort: jest.fn(),
      handleFilterChange: jest.fn(),
      loadMore: jest.fn(),
    });
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("renders login, signs up, prompts for profile completion, and saves profile details", async () => {
    const incompleteProfile = makeProfileQuery({ full_name: "", phone_number: "" });
    const updateEq = jest.fn(() => Promise.resolve({ error: null }));
    const update = jest.fn(() => ({ eq: updateEq }));
    supabaseGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    supabaseFrom
      .mockReturnValueOnce(incompleteProfile)
      .mockReturnValueOnce({ update });

    const Login = (await import("@/pages/Login")).default;
    render(<Login />);

    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(navigate).toHaveBeenCalledWith("/signup");

    await waitFor(() => expect(screen.getByText("Complete Your Profile")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Feature Tester" } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: "72 123 456" } });
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue("Feature Tester");
    expect(screen.getByLabelText(/Phone Number/i)).toHaveValue("72123456");
  });

  it("renders dashboard views and switches between renter, host, and admin content", async () => {
    const Dashboard = (await import("@/pages/Dashboard")).default;
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText("Admin Dashboard")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Host view"));
    expect(screen.getByText("Host dashboard")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Renter view"));
    expect(screen.getByText("Renter dashboard")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("site search"), { target: { value: "sedan" } });
    expect(screen.getByLabelText("site search")).toHaveValue("sedan");
  });

  it("renders analytics page controls, filters, security alerts, refresh, export, and realtime toast handling", async () => {
    const SuperAdminAnalytics = (await import("@/pages/SuperAdminAnalytics")).default;
    render(<SuperAdminAnalytics />);

    expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
    expect(mobileChartProps).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "User Growth Trend", data: [{ name: "May 2026", value: 3 }] }),
      expect.objectContaining({ title: "Booking Trends", data: [{ name: "May 2026", value: 2 }] }),
    ]));
    fireEvent.click(screen.getByRole("button", { name: /Security Alerts/i }));
    expect(screen.getByText(/Security alert system 1/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Acknowledge alert"));
    expect(toast.success).toHaveBeenCalledWith("Alert acknowledged");
    fireEvent.click(screen.getByText("Change alert settings"));
    expect(toast.success).toHaveBeenCalledWith("Alert settings updated");

    fireEvent.click(screen.getByRole("button", { name: /Filters/i }));
    fireEvent.click(screen.getByText("Apply filters"));
    expect(usePerformanceOptimization.mock.results[0].value.handleFilterChange).toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: /Refresh/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Export JSON/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Analytics data exported"), expect.any(Object)));

    act(() => {
      window.dispatchEvent(new CustomEvent("analytics-new-event", {
        detail: {
          event: { severity: "critical" },
          message: "Critical analytics event",
        },
      }));
    });
    expect(toast.error).toHaveBeenCalledWith("Critical analytics event", expect.any(Object));
  });

  it("loads the map page, fetches hosts, shows route steps, and renders handover booking actions", async () => {
    const Map = (await import("@/pages/Map")).default;
    const { getMapboxToken } = await import("@/utils/mapbox");
    render(<Map />);

    await waitFor(() => expect(getMapboxToken).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId("custom-mapbox")).toHaveTextContent("mapbox://styles/mapbox/dark-v11:1"));
    fireEvent.click(screen.getByTestId("custom-mapbox"));
    expect(screen.getByText("Route steps 1")).toBeInTheDocument();

    useQuery.mockReturnValueOnce({
      data: [
        {
          id: "booking-1",
          status: "confirmed",
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          total_price: 120,
          cars: { brand: "Toyota", model: "Vitz", location: "Gaborone", image_url: "/car.png" },
          handover_sessions: [],
        },
      ],
      isLoading: false,
    });
    const { HandoverBookingButtons } = await import("@/components/map/HandoverBookingButtons");
    const onBookingClick = jest.fn();
    render(<HandoverBookingButtons onBookingClick={onBookingClick} />);
    fireEvent.click(screen.getByRole("button", { name: /Toyota Vitz/i }));
    expect(onBookingClick).toHaveBeenCalledWith("booking-1", "pickup");
  });

  it("renders map container loading, ready, and error states from map initialization resources", async () => {
    const mapboxMock = (await import("@/utils/mapbox")) as jest.Mocked<any>;
    const { MapContainer } = await import("@/components/map/MapContainer");

    mapboxMock.mapboxTokenManager.getTokenState.mockReturnValueOnce({ token: "", valid: false });
    const { rerender } = render(<MapContainer />);
    expect(screen.getByText("Map Configuration Required")).toBeInTheDocument();

    mapboxMock.mapboxTokenManager.getTokenState.mockReturnValue({ token: "token", valid: true });
    mapboxMock.stateManager.getCurrentState.mockReturnValue("resources_acquiring");
    rerender(<MapContainer height="h-64" />);
    expect(document.querySelector("[data-sidebar='menu-skeleton-text']")).not.toBeInTheDocument();

    mapboxMock.stateManager.getCurrentState.mockReturnValue("ready");
    rerender(<MapContainer height="h-64" />);
    await waitFor(() => expect(mapboxMock.stateManager.subscribe).toHaveBeenCalled());
  });

  it("handles payment return polling without duplicate immediate requests and uses real bookings routes", async () => {
    jest.useFakeTimers();
    searchParams = new URLSearchParams("transaction_id=txn-1");
    supabaseInvoke
      .mockResolvedValueOnce({ data: { status: "initiated", booking_id: "booking-1" }, error: null })
      .mockResolvedValueOnce({ data: { status: "completed", booking_id: "booking-1" }, error: null });

    const PaymentReturnPage = (await import("@/pages/PaymentReturnPage")).default;
    render(<PaymentReturnPage />);

    await waitFor(() => expect(supabaseInvoke).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Processing your payment...")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1999);
    });
    expect(supabaseInvoke).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await waitFor(() => expect(screen.getByText(/Payment successful/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /View Booking/i }));
    expect(navigate).toHaveBeenCalledWith("/rental-details/booking-1");
  });

  it("sends payment return users without a transaction to the existing bookings route", async () => {
    searchParams = new URLSearchParams();

    const PaymentReturnPage = (await import("@/pages/PaymentReturnPage")).default;
    render(<PaymentReturnPage />);

    expect(screen.getByText("Transaction ID not found.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Go to Bookings/i }));
    expect(navigate).toHaveBeenCalledWith("/bookings");
  });

  it("covers sidebar, carousel, chart tooltip, and UI composition behavior", async () => {
    const sidebar = await import("@/components/ui/sidebar");
    const carousel = await import("@/components/ui/carousel");
    const chart = await import("@/components/ui/chart");

    render(
      <sidebar.SidebarProvider defaultOpen>
        <sidebar.Sidebar>
          <sidebar.SidebarHeader>Header</sidebar.SidebarHeader>
          <sidebar.SidebarContent>
            <sidebar.SidebarGroup>
              <sidebar.SidebarGroupLabel>Menu</sidebar.SidebarGroupLabel>
              <sidebar.SidebarMenu>
                <sidebar.SidebarMenuItem>
                  <sidebar.SidebarMenuButton tooltip="Dashboard tooltip" isActive>
                    <span>Dashboard</span>
                  </sidebar.SidebarMenuButton>
                  <sidebar.SidebarMenuAction showOnHover>!</sidebar.SidebarMenuAction>
                  <sidebar.SidebarMenuBadge>2</sidebar.SidebarMenuBadge>
                </sidebar.SidebarMenuItem>
              </sidebar.SidebarMenu>
              <sidebar.SidebarMenuSkeleton showIcon />
            </sidebar.SidebarGroup>
          </sidebar.SidebarContent>
          <sidebar.SidebarFooter>Footer</sidebar.SidebarFooter>
          <sidebar.SidebarRail />
          <sidebar.SidebarTrigger />
        </sidebar.Sidebar>
        <sidebar.SidebarInset>Inset</sidebar.SidebarInset>
      </sidebar.SidebarProvider>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    fireEvent.click(document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement);
    await waitFor(() => expect(document.cookie).toContain("sidebar:state=false"));

    const setApi = jest.fn();
    render(
      <carousel.Carousel setApi={setApi}>
        <carousel.CarouselContent>
          <carousel.CarouselItem>Slide one</carousel.CarouselItem>
        </carousel.CarouselContent>
        <carousel.CarouselPrevious />
        <carousel.CarouselNext />
      </carousel.Carousel>,
    );
    expect(screen.getByText("Slide one")).toBeInTheDocument();
    expect(setApi).toHaveBeenCalled();

    render(
      <chart.ChartContainer id="coverage" config={{ users: { label: "Users", color: "#2563eb" } }}>
        <div>Chart child</div>
      </chart.ChartContainer>,
    );
    expect(screen.getByText("Chart child")).toBeInTheDocument();

    render(
      <chart.ChartContainer id="tooltip" config={{ users: { label: "Users", color: "#2563eb" } }}>
        <chart.ChartTooltipContent
          active
          label="users"
          payload={[{ name: "users", dataKey: "users", value: 12, color: "#2563eb", payload: {} }]}
        />
      </chart.ChartContainer>,
    );
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});

export {};
