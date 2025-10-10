import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import { ChloeMvpDash } from "@/pages/ChloeMvpDash";
import { CreateCoursePage } from "@/pages/CreateCoursePage";
import { CourseDetailPage } from "@/pages/CourseDetailPage";
import { MyCourses } from "@/pages/MyCourses";
import { RevenueAndPayouts } from "@/pages/RevenueAndPayouts";
import { LearnerManagement } from "@/pages/LearnerManagement";
import { SkillsManagement } from "@/pages/SkillsManagement";
import { Reports } from "@/pages/Reports";
import Marketing from "@/pages/Marketing";
import Settings from "@/pages/Settings";
import HelpSupport from "@/pages/HelpSupport";
import { LiveClassesPage } from "@/pages/LiveClassesPage";
import YoutubeKnowledgePage from "@/pages/YoutubeKnowledgePage";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Add pages below */}
        <Route path="/" component={ChloeMvpDash} />
        <Route path="/search" component={() => <div data-testid="page-search">Search Results - Coming Soon</div>} />
        <Route path="/courses/new" component={CreateCoursePage} />
        <Route path="/courses/:id/edit" component={() => <div data-testid="page-edit-course">Edit Course - Coming Soon</div>} />
        <Route path="/courses/:id" component={CourseDetailPage} />
        <Route path="/courses" component={MyCourses} />
        <Route path="/revenue" component={RevenueAndPayouts} />
        <Route path="/learners" component={LearnerManagement} />
        <Route path="/skills" component={SkillsManagement} />
        <Route path="/live-classes" component={LiveClassesPage} />
        <Route path="/youtube-knowledge" component={YoutubeKnowledgePage} />
        <Route path="/reports" component={Reports} />
        <Route path="/marketing" component={Marketing} />
        <Route path="/settings" component={Settings} />
        <Route path="/help" component={HelpSupport} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
