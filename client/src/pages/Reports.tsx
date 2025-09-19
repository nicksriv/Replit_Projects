import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, 
  ComposedChart, Legend
} from "recharts";
import {
  TrendingUpIcon, BarChart3Icon, PieChartIcon, DownloadIcon,
  DollarSignIcon, UsersIcon, BookOpenIcon, AwardIcon,
  CalendarIcon, TrendingDownIcon, ActivityIcon, TargetIcon,
  FileTextIcon, GraduationCapIcon, MessageSquareIcon, ClockIcon
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, subDays, format, startOfDay, endOfDay } from "date-fns";

// Types
interface Course {
  id: number;
  title: string;
  category: string;
  level: string;
  price: string;
  isPublished: boolean;
  createdAt: string;
  instructorId: number;
}

interface RevenueRecord {
  id: number;
  amount: string;
  source: string;
  description: string;
  createdAt: string;
  instructorId: number;
  courseId: number | null;
}

interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  enrolledAt: string;
  progress: string;
  status: string;
  completedAt: string | null;
  student: {
    id: number;
    username: string;
    email: string;
  };
  course: Course;
}

interface Skill {
  id: number;
  name: string;
  category: string;
  level: string;
  isActive: boolean;
  createdAt: string;
}

interface StudentSkillProgress {
  id: number;
  studentId: number;
  skillId: number;
  currentLevel: string;
  progressPercentage: string;
  assessmentsPassed: number;
  totalAssessments: number;
  lastActivityAt: string;
  skillAchievedAt: string | null;
  student: {
    username: string;
  };
  skill: Skill;
}

interface Communication {
  id: number;
  studentId: number;
  subject: string;
  message: string;
  type: string;
  sentAt: string;
  isRead: boolean;
  student: {
    username: string;
  };
}

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [timeframe, setTimeframe] = useState("30");

  // Update date range when timeframe changes
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    setDateRange({
      from: subDays(new Date(), parseInt(value)),
      to: new Date(),
    });
  };

  // Data queries
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: revenueRecords = [], isLoading: revenueLoading } = useQuery<RevenueRecord[]>({
    queryKey: ["/api/revenue"],
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const { data: studentProgress = [], isLoading: progressLoading } = useQuery<StudentSkillProgress[]>({
    queryKey: ["/api/student-skill-progress"],
  });

  const { data: communications = [], isLoading: communicationsLoading } = useQuery<Communication[]>({
    queryKey: ["/api/communications"],
  });

  // Calculate metrics with date filtering
  const isLoading = coursesLoading || revenueLoading || enrollmentsLoading || skillsLoading || progressLoading || communicationsLoading;

  // Apply date range filtering
  const filteredData = useMemo(() => {
    const fromDate = startOfDay(dateRange?.from || subDays(new Date(), parseInt(timeframe)));
    const toDate = endOfDay(dateRange?.to || new Date());

    return {
      revenueRecords: revenueRecords.filter(record => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= fromDate && recordDate <= toDate;
      }),
      enrollments: enrollments.filter(enrollment => {
        const enrollmentDate = new Date(enrollment.enrolledAt);
        return enrollmentDate >= fromDate && enrollmentDate <= toDate;
      }),
      communications: communications.filter(comm => {
        const commDate = new Date(comm.sentAt);
        return commDate >= fromDate && commDate <= toDate;
      }),
      studentProgress: studentProgress.filter(progress => {
        const activityDate = new Date(progress.lastActivityAt);
        return activityDate >= fromDate && activityDate <= toDate;
      })
    };
  }, [revenueRecords, enrollments, communications, studentProgress, dateRange, timeframe]);

  // Revenue Analytics with filtered data
  const totalRevenue = filteredData.revenueRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0);
  const revenueInRange = filteredData.revenueRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0);
  
  const revenueByMonth = filteredData.revenueRecords.reduce((acc, record) => {
    const month = format(new Date(record.createdAt), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + parseFloat(record.amount);
    return acc;
  }, {} as Record<string, number>);

  const revenueChartData = Object.entries(revenueByMonth).map(([month, amount]) => ({
    month,
    revenue: amount,
    sales: filteredData.revenueRecords.filter(r => format(new Date(r.createdAt), 'MMM yyyy') === month).length
  }));

  // Course Analytics
  const publishedCourses = courses.filter(course => course.isPublished).length;
  const draftCourses = courses.filter(course => !course.isPublished).length;
  
  const coursesByCategory = courses.reduce((acc, course) => {
    acc[course.category] = (acc[course.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const courseCategoryData = Object.entries(coursesByCategory).map(([category, count]) => ({
    name: category,
    value: count,
    percentage: courses.length > 0 ? ((count / courses.length) * 100).toFixed(1) : "0"
  }));

  // Student Analytics with filtered data
  const totalStudents = new Set(filteredData.enrollments.map(e => e.studentId)).size;
  const activeEnrollments = filteredData.enrollments.filter(e => e.status === 'active').length;
  const completedEnrollments = filteredData.enrollments.filter(e => e.status === 'completed').length;
  const averageProgress = filteredData.enrollments.length > 0 
    ? filteredData.enrollments.reduce((sum, e) => sum + parseFloat(e.progress || "0"), 0) / filteredData.enrollments.length 
    : 0;
  const completionRate = filteredData.enrollments.length > 0 
    ? (completedEnrollments / filteredData.enrollments.length) * 100 
    : 0;

  const enrollmentsByMonth = filteredData.enrollments.reduce((acc, enrollment) => {
    const month = format(new Date(enrollment.enrolledAt), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const enrollmentChartData = Object.entries(enrollmentsByMonth).map(([month, count]) => ({
    month,
    enrollments: count,
    completed: filteredData.enrollments.filter(e => 
      e.status === 'completed' && 
      format(new Date(e.enrolledAt), 'MMM yyyy') === month
    ).length
  }));

  // Skills Analytics with filtered data
  const activeSkills = skills.filter(skill => skill.isActive).length;
  const skillsInProgress = filteredData.studentProgress.filter(p => parseFloat(p.progressPercentage) > 0 && parseFloat(p.progressPercentage) < 100).length;
  const skillsCompleted = filteredData.studentProgress.filter(p => parseFloat(p.progressPercentage) >= 100).length;
  const averageSkillProgress = filteredData.studentProgress.length > 0
    ? filteredData.studentProgress.reduce((sum, p) => sum + parseFloat(p.progressPercentage), 0) / filteredData.studentProgress.length
    : 0;

  const skillsByCategory = skills.reduce((acc, skill) => {
    acc[skill.category] = (acc[skill.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const skillCategoryData = Object.entries(skillsByCategory).map(([category, count]) => ({
    name: category,
    value: count
  }));

  // Communication Analytics with filtered data
  const totalMessages = filteredData.communications.length;
  const unreadMessages = filteredData.communications.filter(c => !c.isRead).length;
  const messagesByType = filteredData.communications.reduce((acc, comm) => {
    acc[comm.type] = (acc[comm.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportRevenueReport = () => {
    const reportData = filteredData.revenueRecords.map(record => ({
      date: format(new Date(record.createdAt), 'yyyy-MM-dd'),
      amount: record.amount,
      source: record.source,
      description: record.description
    }));
    exportToCSV(reportData, 'revenue_report');
  };

  const exportStudentReport = () => {
    const reportData = filteredData.enrollments.map(enrollment => ({
      student: enrollment.student.username,
      course: enrollment.course.title,
      enrolledDate: format(new Date(enrollment.enrolledAt), 'yyyy-MM-dd'),
      progress: enrollment.progress,
      status: enrollment.status,
      completedDate: enrollment.completedAt ? format(new Date(enrollment.completedAt), 'yyyy-MM-dd') : 'N/A'
    }));
    exportToCSV(reportData, 'student_report');
  };

  const exportSkillsReport = () => {
    const reportData = filteredData.studentProgress.map(progress => ({
      student: progress.student.username,
      skill: progress.skill.name,
      currentLevel: progress.currentLevel,
      progressPercentage: progress.progressPercentage,
      assessmentsPassed: progress.assessmentsPassed,
      totalAssessments: progress.totalAssessments,
      lastActivity: format(new Date(progress.lastActivityAt), 'yyyy-MM-dd'),
      skillAchieved: progress.skillAchievedAt ? format(new Date(progress.skillAchievedAt), 'yyyy-MM-dd') : 'N/A'
    }));
    exportToCSV(reportData, 'skills_report');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-reports">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into your teaching business</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeframe} onValueChange={handleTimeframeChange} data-testid="select-timeframe">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
              data-testid="date-range-picker"
            />
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSignIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-revenue">
                    ${totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">
                    ${revenueInRange.toLocaleString()} in selected period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-students">
                    {totalStudents}
                  </p>
                  <p className="text-xs text-blue-600">
                    {activeEnrollments} active enrollments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpenIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published Courses</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-published-courses">
                    {publishedCourses}
                  </p>
                  <p className="text-xs text-purple-600">
                    {draftCourses} in draft
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AwardIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Skills Completed</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-skills-completed">
                    {skillsCompleted}
                  </p>
                  <p className="text-xs text-orange-600">
                    {skillsInProgress} in progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Reports */}
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="students" data-testid="tab-students">Student Analytics</TabsTrigger>
            <TabsTrigger value="courses" data-testid="tab-courses">Course Performance</TabsTrigger>
            <TabsTrigger value="skills" data-testid="tab-skills">Skills Development</TabsTrigger>
          </TabsList>

          {/* Revenue Analytics Tab */}
          <TabsContent value="revenue">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Revenue Analytics</h2>
                <Button onClick={exportRevenueReport} variant="outline" data-testid="button-export-revenue">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export Revenue Report
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUpIcon className="h-5 w-5 mr-2" />
                      Revenue Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'revenue' ? `$${value}` : value,
                              name === 'revenue' ? 'Revenue' : 'Sales Count'
                            ]}
                          />
                          <Legend />
                          <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#8884d8" stroke="#8884d8" />
                          <Bar yAxisId="right" dataKey="sales" fill="#82ca9d" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Revenue Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" />
                      Revenue Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={Object.entries(filteredData.revenueRecords.reduce((acc, record) => {
                                acc[record.source] = (acc[record.source] || 0) + parseFloat(record.amount);
                                return acc;
                              }, {} as Record<string, number>)).map(([source, amount]) => ({
                                name: source.replace('_', ' '),
                                value: amount
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(filteredData.revenueRecords.reduce((acc, record) => {
                                acc[record.source] = (acc[record.source] || 0) + parseFloat(record.amount);
                                return acc;
                              }, {} as Record<string, number>)).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value}`} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(filteredData.revenueRecords.reduce((acc, record) => {
                            acc[record.source] = (acc[record.source] || 0) + parseFloat(record.amount);
                            return acc;
                          }, {} as Record<string, number>)).map(([source, amount], index) => (
                            <div key={source} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded mr-2"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <span className="text-sm capitalize" data-testid={`revenue-source-${source}`}>
                                  {source.replace('_', ' ')}
                                </span>
                              </div>
                              <span className="text-sm font-medium" data-testid={`revenue-amount-${source}`}>
                                ${amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Student Analytics Tab */}
          <TabsContent value="students">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Student Analytics</h2>
                <Button onClick={exportStudentReport} variant="outline" data-testid="button-export-students">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export Student Report
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <UsersIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Average Progress</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-avg-progress">
                          {averageProgress.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <GraduationCapIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-completion-rate">
                          {completionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <MessageSquareIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Messages</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-messages">
                          {totalMessages}
                        </p>
                        <p className="text-xs text-purple-600">
                          {unreadMessages} unread
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollment Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3Icon className="h-5 w-5 mr-2" />
                      Enrollment Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={enrollmentChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="enrollments" fill="#8884d8" name="New Enrollments" />
                          <Line type="monotone" dataKey="completed" stroke="#82ca9d" strokeWidth={2} name="Completed" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Student Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ActivityIcon className="h-5 w-5 mr-2" />
                      Student Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={Object.entries(filteredData.enrollments.reduce((acc, enrollment) => {
                                acc[enrollment.status] = (acc[enrollment.status] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)).map(([status, count]) => ({
                                name: status,
                                value: count
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(filteredData.enrollments.reduce((acc, enrollment) => {
                                acc[enrollment.status] = (acc[enrollment.status] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(filteredData.enrollments.reduce((acc, enrollment) => {
                            acc[enrollment.status] = (acc[enrollment.status] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)).map(([status, count], index) => (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded mr-2"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <span className="text-sm capitalize" data-testid={`student-status-${status}`}>
                                  {status}
                                </span>
                              </div>
                              <span className="text-sm font-medium" data-testid={`student-count-${status}`}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Course Performance Tab */}
          <TabsContent value="courses">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Course Performance</h2>
                <Button onClick={() => exportToCSV(courses, 'courses_report')} variant="outline" data-testid="button-export-courses">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export Course Report
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" />
                      Course Distribution by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={courseCategoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percentage }) => `${name} (${percentage}%)`}
                            >
                              {courseCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-1 gap-2">
                          {courseCategoryData.map((category, index) => (
                            <div key={category.name} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded mr-2"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <span className="text-sm" data-testid={`course-category-${category.name}`}>
                                  {category.name}
                                </span>
                              </div>
                              <Badge variant="secondary" data-testid={`course-category-count-${category.name}`}>
                                {category.value} ({category.percentage}%)
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Course Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TargetIcon className="h-5 w-5 mr-2" />
                      Course Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600" data-testid="stat-published-vs-draft">
                            {publishedCourses}
                          </p>
                          <p className="text-sm text-gray-600">Published</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-400" data-testid="stat-draft-courses">
                            {draftCourses}
                          </p>
                          <p className="text-sm text-gray-600">Draft</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Top Performing Courses</h4>
                        {courses
                          .filter(course => course.isPublished)
                          .slice(0, 5)
                          .map((course, index) => {
                            const courseEnrollments = filteredData.enrollments.filter(e => e.courseId === course.id);
                            const completionRate = courseEnrollments.length > 0 
                              ? (courseEnrollments.filter(e => e.status === 'completed').length / courseEnrollments.length) * 100
                              : 0;
                            
                            return (
                              <div key={course.id} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium truncate" data-testid={`course-title-${course.id}`}>
                                    {course.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {courseEnrollments.length} enrollments
                                  </p>
                                </div>
                                <Badge 
                                  variant={completionRate >= 70 ? "default" : completionRate >= 40 ? "secondary" : "outline"}
                                  data-testid={`course-completion-${course.id}`}
                                >
                                  {completionRate.toFixed(0)}%
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Skills Development Tab */}
          <TabsContent value="skills">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Skills Development Analytics</h2>
                <Button onClick={exportSkillsReport} variant="outline" data-testid="button-export-skills">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export Skills Report
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <AwardIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Skills</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-skills-detail">
                          {activeSkills}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUpIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-avg-skill-progress">
                          {averageSkillProgress.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <ClockIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-skills-in-progress">
                          {skillsInProgress}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skills by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" />
                      Skills by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={skillCategoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {skillCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-1 gap-2">
                          {skillCategoryData.map((category, index) => (
                            <div key={category.name} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded mr-2"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <span className="text-sm capitalize" data-testid={`skill-category-${category.name}`}>
                                  {category.name.replace('-', ' ')}
                                </span>
                              </div>
                              <span className="text-sm font-medium" data-testid={`skill-category-count-${category.name}`}>
                                {category.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3Icon className="h-5 w-5 mr-2" />
                      Skills Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-600" data-testid="stat-skills-completed-detail">
                            {skillsCompleted}
                          </p>
                          <p className="text-sm text-gray-600">Completed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600" data-testid="stat-skills-in-progress-detail">
                            {skillsInProgress}
                          </p>
                          <p className="text-sm text-gray-600">In Progress</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-400" data-testid="stat-skills-not-started">
                            {Math.max(0, activeSkills * totalStudents - skillsCompleted - skillsInProgress)}
                          </p>
                          <p className="text-sm text-gray-600">Not Started</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Recent Skill Achievements</h4>
                        {filteredData.studentProgress
                          .filter(p => p.skillAchievedAt)
                          .sort((a, b) => new Date(b.skillAchievedAt!).getTime() - new Date(a.skillAchievedAt!).getTime())
                          .slice(0, 5)
                          .map((progress, index) => (
                            <div key={progress.id} className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium" data-testid={`achievement-student-${progress.id}`}>
                                  {progress.student.username}
                                </p>
                                <p className="text-xs text-gray-500" data-testid={`achievement-skill-${progress.id}`}>
                                  {progress.skill.name}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500" data-testid={`achievement-date-${progress.id}`}>
                                {format(new Date(progress.skillAchievedAt!), 'MMM dd')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}