import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from '../services/axiosConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CSVLink } from 'react-csv';

// If you have an AuthContext, import it and use it. Here, we'll use session values as fallback.
const ManageUsers = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedUserForReport, setSelectedUserForReport] = useState(null);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // DYNAMIC currentUser and currentDateTime
  // You can replace these with your auth provider/context if available. For this project, use session.
  const currentUser = window?.__APP_SESSION_USER__ || 'sandeshkuikel07';
  // Get current UTC time in 'YYYY-MM-DD HH:MM:SS' format
  const getCurrentDateTime = () => {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    return (
      now.getUTCFullYear() +
      '-' +
      pad(now.getUTCMonth() + 1) +
      '-' +
      pad(now.getUTCDate()) +
      ' ' +
      pad(now.getUTCHours()) +
      ':' +
      pad(now.getUTCMinutes()) +
      ':' +
      pad(now.getUTCSeconds())
    );
  };
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());

  // Optionally update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(getCurrentDateTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // CSV report headers
  const csvHeaders = [
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
  
  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    contact_number: ''
  });

  // Fetch users and applications data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all users
        const usersResponse = await axios.get('/api/admin/users');
        setUsers(usersResponse.data);
        
        // Fetch all applications for additional details
        const applicationsResponse = await axios.get('/api/get-all-applications');
        setApplications(applicationsResponse.data);
        
        setLoading(false);
      } catch (error) {
        setError('Error fetching data: ' + (error.response?.data?.message || 'Unknown error'));
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Combine user and application data
  const combinedUserData = useMemo(() => {
    return users.map(user => {
      const application = applications.find(app => app.user_id === user.id);
      return {
        ...user,
        ...application,
        hasApplicationData: !!application
      };
    });
  }, [users, applications]);

  // Form field handling for new user creation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  // Password validation
  const validatePassword = () => {
    if (newUser.password !== newUser.confirmPassword) {
      return "Passwords don't match";
    }
    if (newUser.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  // Create new student
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate password
    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      // Create a custom endpoint for creating users with passwords
      const response = await axios.post('/api/admin/create-user', {
        email: newUser.email,
        password: newUser.password,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        contact_number: newUser.contact_number
      });
      
      setSuccess('User created successfully');
      
      // Add the new user to the state
      const newUserData = {
        id: response.data.user_id,
        email: newUser.email,
        has_application: false,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        contact_number: newUser.contact_number
      };
      
      setUsers(prev => [...prev, newUserData]);

      // Reset form
      setNewUser({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        contact_number: ''
      });
    } catch (error) {
      setError('Failed to create user: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setUserToDelete(null);
    setShowDeleteDialog(false);
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await axios.delete(`/api/admin/delete-user/${userToDelete.id}`);
      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      setSuccess(`User ${userToDelete.email} deleted successfully`);
      closeDeleteDialog();
    } catch (error) {
      setError('Failed to delete user: ' + (error.response?.data?.message || 'Unknown error'));
      closeDeleteDialog();
    }
  };

  // Fetch detailed application data for report generation
  const fetchApplicationData = async (userId, applicationId) => {
    try {
      setGeneratingReport(true);
      let applicationData;
      
      if (applicationId) {
        const response = await axios.get(`/api/get-application/${applicationId}`);
        applicationData = response.data;
      } else {
        // If no application ID, we'll use minimal data
        const user = users.find(u => u.id === userId);
        applicationData = {
          ...user,
          note: "No detailed application data available"
        };
      }
      
      setReportData(applicationData);
      setShowReportModal(true);
      setGeneratingReport(false);
    } catch (error) {
      setError('Failed to fetch application data: ' + (error.response?.data?.message || 'Unknown error'));
      setGeneratingReport(false);
    }
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
    doc.text(`Report generated: ${currentDateTime}`, 20, 30);
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
    
    // Add report metadata
    yPosition = 270;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by: ${currentUser}`, 20, yPosition);
    doc.text(`Generated on: ${currentDateTime}`, 20, yPosition + 7);
    
    // Save the PDF with the correct filename format
    const fileName = `${reportData.first_name || 'unknown'}_${reportData.last_name || 'unknown'}_report.pdf`;
    doc.save(fileName);
  };

  // Generate and download CSV report
  const prepareCsvData = () => {
    if (!reportData) return [];
    
    return [{
      email: reportData.email || '',
      first_name: reportData.first_name || '',
      last_name: reportData.last_name || '',
      contact_number: reportData.contact_number || '',
      gender: reportData.gender || '',
      final_percentage: reportData.final_percentage || '',
      tentative_ranking: reportData.tentative_ranking || '',
      preferred_programs: reportData.preferred_programs || '',
      english_proficiency: reportData.english_proficiency || '',
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

  // Prepare for report generation
  const handleReportRequest = (user) => {
    setSelectedUserForReport(user);
    fetchApplicationData(user.id, user.application_id);
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
          <p className="text-muted">Loading user data...</p>
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
            Manage <span className="fw-bold">Users</span>
          </h1>
          <p className="text-muted">Add, delete, and manage user accounts</p>
        </div>
        <div className="col-auto">
          <Link to="/admin/dashboard" className="btn btn-sm" style={{
            backgroundColor: 'rgba(108, 117, 125, 0.1)',
            color: '#6c757d',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            padding: '0.5rem 1rem'
          }}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
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
      
      {success && (
        <div className="alert alert-success py-2 px-3 mb-4" style={{
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: 'none',
          backgroundColor: 'rgba(25, 135, 84, 0.1)'
        }}>
          <i className="bi bi-check-circle me-2"></i>{success}
        </div>
      )}

      {/* Main content area */}
      <div className="row g-4">
        {/* Left column: New User form */}
        <div className="col-lg-4">
          {/* Add New User Card */}
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header py-3 bg-white border-bottom">
              <div className="d-flex align-items-center">
                <i className="bi bi-person-plus text-primary me-2"></i>
                <h3 className="h5 mb-0">Add New User</h3>
              </div>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white" style={{ borderRadius: '8px 0 0 8px' }}>
                      <i className="bi bi-envelope text-muted"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      placeholder="student@example.com"
                      value={newUser.email}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: '0 8px 8px 0' }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white" style={{ borderRadius: '8px 0 0 8px' }}>
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      placeholder="Set password (min 6 characters)"
                      value={newUser.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                      style={{ borderRadius: '0 8px 8px 0' }}
                    />
                  </div>
                  <div className="form-text">Password must be at least 6 characters long.</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white" style={{ borderRadius: '8px 0 0 8px' }}>
                      <i className="bi bi-lock-fill text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={newUser.confirmPassword}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: '0 8px 8px 0' }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="first_name" className="form-label">
                    First Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white" style={{ borderRadius: '8px 0 0 8px' }}>
                      <i className="bi bi-person text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="first_name"
                      name="first_name"
                      placeholder="Enter first name"
                      value={newUser.first_name}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: '0 8px 8px 0' }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="last_name" className="form-label">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white" style={{ borderRadius: '8px 0 0 8px' }}>
                      <i className="bi bi-person-fill text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="last_name"
                      name="last_name"
                      placeholder="Enter last name"
                      value={newUser.last_name}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: '0 8px 8px 0' }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="contact_number" className="form-label">
                    Contact Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white" style={{ borderRadius: '8px 0 0 8px' }}>
                      <i className="bi bi-phone text-muted"></i>
                    </span>
                    <input
                      type="tel"
                      className="form-control"
                      id="contact_number"
                      name="contact_number"
                      placeholder="Enter contact number"
                      value={newUser.contact_number}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: '0 8px 8px 0' }}
                    />
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      backgroundColor: 'rgba(13, 110, 253, 0.1)', 
                      color: '#0d6efd',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      padding: '0.6rem 1rem'
                    }}
                  >
                    <i className="bi bi-person-plus me-2"></i>Create User Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right column: User List */}
        <div className="col-lg-8">
          {/* User List Card */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header py-3 bg-white border-bottom">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className="bi bi-people text-primary me-2"></i>
                  <h3 className="h5 mb-0">User List</h3>
                </div>
                <div>
                  <button 
                    className="btn btn-sm"
                    style={{
                      backgroundColor: 'rgba(25, 135, 84, 0.1)',
                      color: '#198754',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      padding: '0.5rem 0.75rem'
                    }}
                    onClick={() => {
                      // Create a workbook with all users for bulk download
                      if (combinedUserData.length) {
                        // Just trigger the hidden CSVLink component for all users
                        document.getElementById('csvDownloadAllUsers').click();
                      } else {
                        setError('No users to export');
                      }
                    }}
                  >
                    <i className="bi bi-download me-1"></i>
                    Export All ({combinedUserData.length})
                  </button>
                  
                  {/* Hidden CSV link for bulk download */}
                  <CSVLink
                    id="csvDownloadAllUsers"
                    data={combinedUserData.map(user => ({
                      email: user.email || '',
                      first_name: user.first_name || '',
                      last_name: user.last_name || '',
                      contact_number: user.contact_number || '',
                      gender: user.gender || '',
                      final_percentage: user.final_percentage || '',
                      tentative_ranking: user.tentative_ranking || '',
                      preferred_programs: user.preferred_programs || '',
                      english_proficiency: user.english_proficiency || '',
                    }))}
                    headers={csvHeaders}
                    filename={`all_users_export_${new Date().toISOString().split('T')[0]}.csv`}
                    className="d-none"
                  >
                    Download CSV
                  </CSVLink>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {combinedUserData.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-people text-muted fs-1"></i>
                  <p className="mt-3 text-muted">No users found in the system.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">User</th>
                        <th>Contact</th>
                        <th>Application Status</th>
                        <th className="text-end pe-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedUserData.map(user => (
                        <tr key={user.id}>
                          <td className="ps-4">
                            <div className="d-flex flex-column">
                              <span className="fw-medium">
                                {`${user.first_name || ''} ${user.last_name || ''}`}
                              </span>
                              <span className="text-primary small">{user.email}</span>
                            </div>
                          </td>
                          <td>
                            {user.contact_number ? (
                              <span>{user.contact_number}</span>
                            ) : (
                              <span className="text-muted small">Not provided</span>
                            )}
                          </td>
                          <td>
                            {user.hasApplicationData ? (
                              <div className="d-inline-block px-2 py-1 rounded" style={{ 
                                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                color: '#198754'
                              }}>
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Application Submitted
                              </div>
                            ) : (
                              <div className="d-inline-block px-2 py-1 rounded" style={{ 
                                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                color: '#ffc107'
                              }}>
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                No Application
                              </div>
                            )}
                          </td>
              
                          <td className="text-end pe-4">
                            <div className="d-flex justify-content-end gap-2">
                              {user.hasApplicationData && user.application_id && (
                                <Link
                                  to={`/admin/application/${user.application_id}`}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: 'rgba(13, 110, 253, 0.1)', 
                                    color: '#0d6efd',
                                    borderRadius: '6px'
                                  }}
                                  title="View user's application"
                                >
                                  <i className="bi bi-eye me-1"></i> View
                                </Link>
                              )}
                              <button
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                  color: '#198754',
                                  borderRadius: '6px'
                                }}
                                onClick={() => handleReportRequest(user)}
                                title="Generate report"
                                disabled={generatingReport}
                              >
                                {generatingReport && selectedUserForReport?.id === user.id ? (
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className="bi bi-file-earmark-text me-1"></i>
                                )}
                                Report
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: 'rgba(220, 53, 69, 0.1)', 
                                  color: '#dc3545',
                                  borderRadius: '6px'
                                }}
                                onClick={() => openDeleteDialog(user)}
                                title="Delete user"
                              >
                                <i className="bi bi-trash me-1"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="card-footer bg-white py-3 border-top">
              <div className="d-flex justify-content-between align-items-center small text-muted">
                <div>
                  <i className="bi bi-info-circle me-1"></i> 
                  Showing {combinedUserData.length} users in the system
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteDialog && userToDelete && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                  Confirm Deletion
                </h5>
                <button type="button" className="btn-close" onClick={closeDeleteDialog}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ 
                    width: '80px', 
                    height: '80px', 
                    backgroundColor: 'rgba(220, 53, 69, 0.1)' 
                  }}>
                    <i className="bi bi-trash fs-1 text-danger"></i>
                  </div>
                  <h4>Are you sure?</h4>
                  <p className="text-muted">
                    You are about to delete the user <strong>{userToDelete.first_name} {userToDelete.last_name}</strong> ({userToDelete.email}). 
                    This action cannot be undone.
                  </p>
                </div>
                <div className="alert alert-warning p-2">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    All data associated with this user will be permanently removed from the system.
                  </small>
                </div>
              </div>
              <div className="modal-footer" style={{ border: 'none' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteDialog}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDeleteUser}
                >
                  <i className="bi bi-trash me-1"></i> Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Report Generation Modal */}
      {showReportModal && reportData && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-text text-primary me-2"></i>
                  Generate User Report
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
                    The report will include all available user data including personal details, academic information, and application status.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowReportModal(false)}>
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

export default ManageUsers;