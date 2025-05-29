import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from '../services/axiosConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CSVLink } from 'react-csv';

const AdminDashboard = () => {
  // State management
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Advanced filtering state
  const [filters, setFilters] = useState({
    searchQuery: '',
    finalPercentage: '',
    gender: '',
    enrollmentStatus: '',
    university: '',
    sortBy: 'id'
  });

  // CSV report headers
  const csvHeaders = [
    { label: "ID", key: "id" },
    { label: "Email", key: "email" },
    { label: "First Name", key: "first_name" },
    { label: "Last Name", key: "last_name" },
    { label: "Contact Number", key: "contact_number" },
    { label: "Gender", key: "gender" },
    { label: "Final Percentage", key: "final_percentage" },
    { label: "Ranking", key: "tentative_ranking" },
    { label: "Preferred Programs", key: "preferred_programs" },
    { label: "English Proficiency", key: "english_proficiency" }
  ];

  // Fetch applications data
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/get-all-applications');
        setApplications(response.data);
        setLoading(false);
      } catch (error) {
        setError('Error fetching applications: ' + (error.response?.data?.message || 'Unknown error'));
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Filter applications based on criteria
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Search query filter (id, email, name, contact)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(app =>
        (app.id?.toString().includes(query)) ||
        (app.email?.toLowerCase().includes(query)) ||
        (app.first_name?.toLowerCase().includes(query)) ||
        (app.last_name?.toLowerCase().includes(query)) ||
        (app.contact_number?.toLowerCase().includes(query)) ||
        (`${app.first_name} ${app.last_name}`.toLowerCase().includes(query))
      );
    }

    // Final percentage filter
    if (filters.finalPercentage) {
      const [min, max] = filters.finalPercentage.split('-').map(Number);
      result = result.filter(app => {
        const percentage = parseFloat(app.final_percentage);
        return !isNaN(percentage) && percentage >= min && percentage <= max;
      });
    }

    // Gender filter
    if (filters.gender) {
      result = result.filter(app => app.gender === filters.gender);
    }

    // Enrollment status filter
    if (filters.enrollmentStatus) {
      result = result.filter(app => app.enrollment_status === filters.enrollmentStatus);
    }

    // University filter (searches across all university fields)
    if (filters.university) {
      const query = filters.university.toLowerCase();
      result = result.filter(app =>
        (app.target_universities?.toLowerCase().includes(query)) ||
        (app.applied_universities?.toLowerCase().includes(query)) ||
        (app.accepted_universities?.toLowerCase().includes(query)) ||
        (app.enrolled_university?.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'id':
          return a.id - b.id;
        case 'name':
          return `${a.first_name || ''} ${a.last_name || ''}`.localeCompare(`${b.first_name || ''} ${b.last_name || ''}`);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'percentage':
          return (parseFloat(b.final_percentage) || 0) - (parseFloat(a.final_percentage) || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [applications, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      finalPercentage: '',
      gender: '',
      sortBy: 'id'
    });
  };

  // Handle application deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await axios.delete(`/api/delete-application/${id}`);
        setApplications(applications.filter(app => app.id !== id));
        setDeleteSuccess('Application deleted successfully');
        setTimeout(() => setDeleteSuccess(''), 3000);
      } catch (error) {
        setError('Error deleting application: ' + (error.response?.data?.message || 'Unknown error'));
      }
    }
  };

  // Fetch detailed application data for report generation
  const fetchApplicationDataForReport = async (applicationId) => {
    try {
      setGeneratingReport(true);
      const response = await axios.get(`/api/get-application/${applicationId}`);
      setReportData(response.data);
      setShowReportModal(true);
      setGeneratingReport(false);
    } catch (error) {
      setError('Failed to fetch application data: ' + (error.response?.data?.message || 'Unknown error'));
      setGeneratingReport(false);
    }
  };

  // Prepare for report generation
  const handleReportRequest = (application) => {
    setSelectedApplication(application);
    fetchApplicationDataForReport(application.id);
  };

  // Generate and download PDF report
  const generatePdfReport = () => {
    if (!reportData) return;

    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Add title and styling
    doc.setFontSize(20);
    doc.setTextColor(13, 110, 253); // Main blue color
    doc.text('Student Application Report', 105, 15, { align: 'center' });
    doc.setDrawColor(13, 110, 253);
    doc.line(20, 20, 190, 20);

    // Add student info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Report generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Student: ${reportData.first_name || ''} ${reportData.last_name || ''}`, 20, 40);
    doc.text(`Email: ${reportData.email || ''}`, 20, 50);
    doc.text(`Contact: ${reportData.contact_number || ''}`, 20, 60);

    // Add academic details
    doc.setFontSize(14);
    doc.setTextColor(13, 110, 253);
    doc.text('Academic Details', 20, 75);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Final Percentage:', 30, 85);
    doc.text(`${reportData.final_percentage || 'N/A'}%`, 130, 85);

    doc.text('Tentative Ranking:', 30, 95);
    doc.text(reportData.tentative_ranking || 'N/A', 130, 95);

    doc.text('English Proficiency:', 30, 105);
    doc.text(reportData.english_proficiency || 'N/A', 130, 105);

    doc.text('Preferred Programs:', 30, 115);
    const programLines = doc.splitTextToSize(reportData.preferred_programs || 'N/A', 70);
    doc.text(programLines, 130, 115);

    // Calculate next Y position based on the number of lines in programs
    let yPosition = 115 + (programLines.length * 7) + 15;

    // Add strengths and weaknesses
    doc.setFontSize(14);
    doc.setTextColor(13, 110, 253);
    doc.text('Strengths & Weaknesses', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Strengths:', 20, yPosition);

    // Handle multiline text
    const strengthLines = doc.splitTextToSize(reportData.strong_points || 'N/A', 160);
    doc.text(strengthLines, 30, yPosition + 7);

    yPosition += (strengthLines.length * 7) + 15;
    doc.text('Weaknesses:', 20, yPosition);

    const weaknessLines = doc.splitTextToSize(reportData.weak_points || 'N/A', 160);
    doc.text(weaknessLines, 30, yPosition + 7);

    // Save the PDF with the correct filename format
    const fileName = `${reportData.first_name || 'unknown'}_${reportData.last_name || 'unknown'}_report.pdf`;
    doc.save(fileName);
  };

  // Generate and download CSV report
  const prepareCsvData = () => {
    if (!reportData) return [];

    return [{
      id: reportData.id || '',
      email: reportData.email || '',
      first_name: reportData.first_name || '',
      last_name: reportData.last_name || '',
      contact_number: reportData.contact_number || '',
      gender: reportData.gender || '',
      final_percentage: reportData.final_percentage || '',
      tentative_ranking: reportData.tentative_ranking || '',
      preferred_programs: reportData.preferred_programs || '',
      english_proficiency: reportData.english_proficiency || ''
    }];
  };

  // Generate report based on selected format
  const generateReport = () => {
    if (reportFormat === 'pdf') {
      generatePdfReport();
    }
    // CSV download is handled by CSVLink component
    setShowReportModal(false);
  };

  // Helper function to get gender icon and color
  const getGenderDisplay = (gender) => {
    switch (gender) {
      case 'Male':
        return { icon: 'bi-gender-male', color: '#0d6efd', bgColor: '#e6f0ff', text: 'Male' };
      case 'Female':
        return { icon: 'bi-gender-female', color: '#d63384', bgColor: '#fce8f3', text: 'Female' };
      case 'Other':
        return { icon: 'bi-gender-ambiguous', color: '#6c757d', bgColor: '#f0f0f0', text: 'Other' };
      default:
        return { icon: 'bi-question-circle', color: '#6c757d', bgColor: '#f0f0f0', text: 'Unknown' };
    }
  };

  // Helper function to get percentage display class and style
  const getPercentageDisplay = (percentage) => {
    const numericPercentage = parseFloat(percentage);

    if (isNaN(numericPercentage)) {
      return { color: '#6c757d', bgColor: '#f0f0f0', textColor: '#6c757d', text: 'N/A' };
    }

    if (numericPercentage >= 90) {
      return { color: '#198754', bgColor: '#e8f6f0', textColor: '#198754', text: 'Excellent' };
    } else if (numericPercentage >= 80) {
      return { color: '#20c997', bgColor: '#e6fbf6', textColor: '#198754', text: 'Very Good' };
    } else if (numericPercentage >= 70) {
      return { color: '#0d6efd', bgColor: '#e6f0ff', textColor: '#0d6efd', text: 'Good' };
    } else if (numericPercentage >= 60) {
      return { color: '#ffc107', bgColor: '#fff8e5', textColor: '#997404', text: 'Average' };
    } else {
      return { color: '#dc3545', bgColor: '#f8d7da', textColor: '#dc3545', text: 'Below Avg' };
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{
        background: '#f8f9fa'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-4 px-md-5">
      {/* Page header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="h3 fw-light mb-0" style={{ letterSpacing: '-0.5px' }}>
            Admin <span className="fw-bold">Dashboard</span>
          </h1>
          <p className="text-muted">Manage applications and system settings</p>
        </div>
      </div>

      {/* Error and success alerts */}
      {error && (
        <div className="alert alert-danger py-2 px-3 mb-4" style={{
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: 'none',
          backgroundColor: 'rgba(220, 53, 69, 0.1)'
        }}>
          <i className="bi bi-exclamation-circle me-2"></i>{error}
        </div>
      )}

      {deleteSuccess && (
        <div className="alert alert-success py-2 px-3 mb-4" style={{
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: 'none',
          backgroundColor: 'rgba(25, 135, 84, 0.1)'
        }}>
          <i className="bi bi-check-circle me-2"></i>{deleteSuccess}
        </div>
      )}

      {/* Dashboard Metrics */}
      <div className="row mb-4">
        <div className="col-md-6 col-xl-3 mb-4 mb-xl-0">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                  <i className="bi bi-file-earmark-text fs-4 text-primary"></i>
                </div>
                <div>
                  <h5 className="card-title mb-1">Total Applications</h5>
                  <h2 className="fw-bold text-primary mb-0">{applications.length}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3 mb-4 mb-xl-0">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                  <i className="bi bi-gender-ambiguous fs-4 text-success"></i>
                </div>
                <div>
                  <h5 className="card-title mb-1">Gender Distribution</h5>
                  <div className="d-flex gap-3 mt-2">
                    <div className="text-center">
                      <div className="px-2 py-1 rounded" style={{ backgroundColor: '#e6f0ff' }}>
                        <i className="bi bi-gender-male me-1" style={{ color: '#0d6efd' }}></i>
                        <span style={{ color: '#0d6efd', fontWeight: 'bold' }}>
                          {applications.filter(app => app.gender === 'Male').length}
                        </span>
                      </div>
                      <div className="mt-1 small" style={{ color: '#0d6efd' }}>Male</div>
                    </div>
                    <div className="text-center">
                      <div className="px-2 py-1 rounded" style={{ backgroundColor: '#fce8f3' }}>
                        <i className="bi bi-gender-female me-1" style={{ color: '#d63384' }}></i>
                        <span style={{ color: '#d63384', fontWeight: 'bold' }}>
                          {applications.filter(app => app.gender === 'Female').length}
                        </span>
                      </div>
                      <div className="mt-1 small" style={{ color: '#d63384' }}>Female</div>
                    </div>
                    <div className="text-center">
                      <div className="px-2 py-1 rounded" style={{ backgroundColor: '#f0f0f0' }}>
                        <i className="bi bi-gender-ambiguous me-1" style={{ color: '#6c757d' }}></i>
                        <span style={{ color: '#6c757d', fontWeight: 'bold' }}>
                          {applications.filter(app => app.gender === 'Other').length}
                        </span>
                      </div>
                      <div className="mt-1 small" style={{ color: '#6c757d' }}>Other</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3 mb-4 mb-md-0">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
                  <i className="bi bi-graph-up fs-4 text-danger"></i>
                </div>
                <div>
                  <h5 className="card-title mb-1">High Performers</h5>
                  <h2 className="fw-bold text-danger mb-0">
                    {applications.filter(app => parseFloat(app.final_percentage) >= 80).length}
                  </h2>
                  <small className="text-muted">Applicants with 80%+</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
                  <i className="bi bi-clock-history fs-4 text-warning"></i>
                </div>
                <div>
                  <h5 className="card-title mb-1">Recent Applications</h5>
                  <h2 className="fw-bold text-warning mb-0">
                    {applications.filter(app => {
                      const createdDate = new Date(app.created_at);
                      const now = new Date();
                      const diffTime = Math.abs(now - createdDate);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 7;
                    }).length}
                  </h2>
                  <small className="text-muted">Last 7 days</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-funnel-fill text-primary me-2"></i>
            <h3 className="h5 mb-0">Search & Filter Applications</h3>
          </div>
        </div>
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-6 col-lg-4">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="searchQuery"
                  name="searchQuery"
                  placeholder="Search by ID, name, email, or contact"
                  value={filters.searchQuery}
                  onChange={handleFilterChange}
                />
                <label htmlFor="searchQuery">Search by ID, name, email, or contact</label>
              </div>
            </div>

            {/* // Add new filter controls to the filter card */}
            <div className="col-md-6 col-lg-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="enrollmentStatus"
                  name="enrollmentStatus"
                  value={filters.enrollmentStatus}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="planning">Planning to Apply</option>
                  <option value="applied">Applied</option>
                  <option value="accepted">Accepted</option>
                  <option value="enrolled">Enrolled</option>
                </select>
                <label htmlFor="enrollmentStatus">Enrollment Status</label>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-select"
                  id="university"
                  name="university"
                  value={filters.university}
                  onChange={handleFilterChange}
                  placeholder="Filter by university"
                />
                <label htmlFor="university">University (contains)</label>
              </div>
            </div>

            <div className="col-md-6 col-lg-2">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="gender"
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <label htmlFor="gender">Gender</label>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="finalPercentage"
                  name="finalPercentage"
                  value={filters.finalPercentage}
                  onChange={handleFilterChange}
                >
                  <option value="">All Percentages</option>
                  <option value="90-100">90% - 100% (Excellent)</option>
                  <option value="80-90">80% - 90% (Very Good)</option>
                  <option value="70-80">70% - 80% (Good)</option>
                  <option value="60-70">60% - 70% (Average)</option>
                  <option value="0-60">Below 60% (Below Average)</option>
                </select>
                <label htmlFor="finalPercentage">Final Percentage</label>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="sortBy"
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                >
                  <option value="id">Sort by ID</option>
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                  <option value="percentage">Sort by Percentage (highest first)</option>
                </select>
                <label htmlFor="sortBy">Sort Results</label>
              </div>
            </div>

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-outline-secondary"
                  onClick={resetFilters}
                >
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Reset Filters
                </button>

                <div className="alert alert-info py-2 mb-0 d-inline-block">
                  <small>
                    <i className="bi bi-info-circle me-2"></i>
                    Showing {filteredApplications.length} of {applications.length} applications
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="bi bi-table text-primary me-2"></i>
              <h3 className="h5 mb-0">Applications</h3>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted fs-1"></i>
              <p className="mt-3 text-muted">No applications found matching your criteria.</p>
              <button className="btn btn-outline-primary" onClick={resetFilters}>
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4" style={{ width: '8%' }}>ID</th>
                    <th style={{ width: '22%' }}>Student</th>
                    <th style={{ width: '15%' }}>Contact</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Gender</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Final %</th>
                    <th className="text-end pe-4" style={{ width: '18%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map(application => {
                    const genderDisplay = getGenderDisplay(application.gender);
                    const percentageDisplay = getPercentageDisplay(application.final_percentage);
                    const getEnrollmentStatusDisplay = (status) => {
                      switch (status) {
                        case 'planning':
                          return { icon: 'bi-hourglass', color: '#6c757d', bgColor: '#f0f0f0', text: 'Planning' };
                        case 'applied':
                          return { icon: 'bi-send', color: '#0d6efd', bgColor: '#e6f0ff', text: 'Applied' };
                        case 'accepted':
                          return { icon: 'bi-check-circle', color: '#20c997', bgColor: '#e6fbf6', text: 'Accepted' };
                        case 'enrolled':
                          return { icon: 'bi-mortarboard-fill', color: '#198754', bgColor: '#e8f6f0', text: 'Enrolled' };
                        default:
                          return { icon: 'bi-question-circle', color: '#6c757d', bgColor: '#f0f0f0', text: 'Unknown' };
                      }
                    };
                    const enrollmentDisplay = getEnrollmentStatusDisplay(application.enrollment_status || 'planning');

                    return (
                      <tr key={application.id}>
                        <td className="ps-4 fw-medium">{application.id}</td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-medium">
                              {`${application.first_name || ''} ${application.last_name || ''}`}
                            </span>
                            <span className="text-primary small">{application.email}</span>
                          </div>
                        </td>
                        <td>{application.contact_number}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="d-inline-block px-2 py-1 rounded"
                            style={{ backgroundColor: genderDisplay.bgColor }}>
                            <i className={`bi ${genderDisplay.icon} me-1`} style={{ color: genderDisplay.color }}></i>
                            <span style={{ color: genderDisplay.color }}>{genderDisplay.text}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="d-inline-block px-2 py-1 rounded" style={{ backgroundColor: percentageDisplay.bgColor }}>
                            <span style={{ color: percentageDisplay.color, fontWeight: 'bold' }}>
                              {application.final_percentage}%
                            </span>
                            <span className="ms-1" style={{ color: percentageDisplay.textColor, fontSize: '0.8rem' }}>
                              ({percentageDisplay.text})
                            </span>
                          </div>
                          {application.tentative_ranking && (
                            <div className="mt-1">
                              <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>
                                {application.tentative_ranking}
                              </span>
                            </div>
                          )}
                        </td>
                        {/* University Status column */}
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="d-inline-block px-2 py-1 rounded me-2"
                              style={{ backgroundColor: enrollmentDisplay.bgColor }}>
                              <i className={`bi ${enrollmentDisplay.icon} me-1`} style={{ color: enrollmentDisplay.color }}></i>
                              <span style={{ color: enrollmentDisplay.color }}>{enrollmentDisplay.text}</span>
                            </div>

                            {application.enrollment_status === 'enrolled' && application.enrolled_university && (
                              <span className="badge bg-success">{application.enrolled_university}</span>
                            )}
                          </div>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <Link
                              to={`/admin/application/${application.id}`}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                color: '#0d6efd',
                                borderRadius: '6px'
                              }}
                              title="View Application"
                            >
                              <i className="bi bi-eye me-1"></i> View
                            </Link>
                            <Link
                              to={`/admin/edit-application/${application.id}`}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                color: '#ffc107',
                                borderRadius: '6px'
                              }}
                              title="Edit Application"
                            >
                              <i className="bi bi-pencil me-1"></i> Edit
                            </Link>
                            <button
                              className="btn btn-sm"
                              style={{
                                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                color: '#dc3545',
                                borderRadius: '6px'
                              }}
                              onClick={() => handleDelete(application.id)}
                              title="Delete Application"
                            >
                              <i className="bi bi-trash me-1"></i> Delete
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{
                                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                color: '#198754',
                                borderRadius: '6px'
                              }}
                              onClick={() => handleReportRequest(application)}
                              title="Generate Report"
                              disabled={generatingReport}
                            >
                              {generatingReport && selectedApplication?.id === application.id ? (
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              ) : (
                                <i className="bi bi-file-earmark-text me-1"></i>
                              )}
                              Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer bg-white py-3 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <div className="small text-muted">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm mb-0">
                <li className="page-item disabled">
                  <span className="page-link">Previous</span>
                </li>
                <li className="page-item active">
                  <span className="page-link">1</span>
                </li>
                <li className="page-item disabled">
                  <span className="page-link">Next</span>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Report Generation Modal */}
      {showReportModal && reportData && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-text text-primary me-2"></i>
                  Generate Student Report
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowReportModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p>
                    Generate a report for <strong>{reportData.first_name} {reportData.last_name}</strong>
                  </p>

                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportFormat"
                      id="pdfFormat"
                      value="pdf"
                      checked={reportFormat === 'pdf'}
                      onChange={() => setReportFormat('pdf')}
                    />
                    <label className="form-check-label" htmlFor="pdfFormat">
                      PDF Format <small className="text-muted">(Comprehensive report with formatting)</small>
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportFormat"
                      id="csvFormat"
                      value="csv"
                      checked={reportFormat === 'csv'}
                      onChange={() => setReportFormat('csv')}
                    />
                    <label className="form-check-label" htmlFor="csvFormat">
                      CSV Format <small className="text-muted">(Data only, compatible with Excel)</small>
                    </label>
                  </div>
                </div>

                <div className="alert alert-info py-2">
                  <small>
                    <i className="bi bi-info-circle me-2"></i>
                    The report will include all available student data including personal details, academic information, and application status.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>

                {reportFormat === 'csv' ? (
                  <CSVLink
                    data={prepareCsvData()}
                    headers={csvHeaders}
                    filename={`${reportData.first_name || 'unknown'}_${reportData.last_name || 'unknown'}_report.csv`}
                    className="btn btn-success"
                    onClick={() => setShowReportModal(false)}
                  >
                    <i className="bi bi-download me-2"></i>
                    Download CSV
                  </CSVLink>
                ) : (
                  <button type="button" className="btn btn-success" onClick={generateReport}>
                    <i className="bi bi-download me-2"></i>
                    Download Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;