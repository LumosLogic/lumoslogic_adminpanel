import { Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "./lib/auth";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Team from "./pages/Team";
import Services from "./pages/Services";
import Blog from "./pages/Blog";
import Products from "./pages/Products";
import CaseStudies from "./pages/CaseStudies";
import FAQ from "./pages/FAQ";
import CompanySettings from "./pages/CompanySettings";
import CloudinarySettings from "./pages/CloudinarySettings";
import Leadership from "./pages/Leadership";
import TeamOrder from "./pages/TeamOrder";
import Timeline from "./pages/Timeline";
import CompanyValues from "./pages/CompanyValues";
import Testimonials from "./pages/Testimonials";
import Clients from "./pages/Clients";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/jobs" replace />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="applications" element={<Applications />} />
        <Route path="team" element={<Team />} />
        <Route path="team-order" element={<TeamOrder />} />
        <Route path="services" element={<Services />} />
        <Route path="blog" element={<Blog />} />
        <Route path="products" element={<Products />} />
        <Route path="case-studies" element={<CaseStudies />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="leadership" element={<Leadership />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="company-values" element={<CompanyValues />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="clients" element={<Clients />} />
        <Route path="company-settings" element={<CompanySettings />} />
        <Route path="cloudinary-settings" element={<CloudinarySettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/jobs" replace />} />
    </Routes>
  );
}
