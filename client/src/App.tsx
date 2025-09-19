import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { ChloeMvpDash } from "@/pages/ChloeMvpDash";
import { CreateCoursePage } from "@/pages/CreateCoursePage";
import { MyCourses } from "@/pages/MyCourses";
import { RevenueAndPayouts } from "@/pages/RevenueAndPayouts";
import { LearnerManagement } from "@/pages/LearnerManagement";
import { SkillsManagement } from "@/pages/SkillsManagement";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={ChloeMvpDash} />
      <Route path="/search" component={() => <div data-testid="page-search">Search Results - Coming Soon</div>} />
      <Route path="/courses/new" component={CreateCoursePage} />
      <Route path="/courses/:id/edit" component={() => <div data-testid="page-edit-course">Edit Course - Coming Soon</div>} />
      <Route path="/courses/:id" component={() => <div data-testid="page-course-detail">Course Details - Coming Soon</div>} />
      <Route path="/courses" component={MyCourses} />
      <Route path="/revenue" component={RevenueAndPayouts} />
      <Route path="/learners" component={LearnerManagement} />
      <Route path="/skills" component={SkillsManagement} />
      <Route path="/reports" component={() => <div data-testid="page-reports">Reports - Coming Soon</div>} />
      <Route path="/marketing" component={() => <div data-testid="page-marketing">Marketing - Coming Soon</div>} />
      <Route path="/settings" component={() => <div data-testid="page-settings">Settings - Coming Soon</div>} />
      <Route path="/help" component={() => <div data-testid="page-help">Help & Support - Coming Soon</div>} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
