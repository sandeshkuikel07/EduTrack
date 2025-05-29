import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../services/axiosConfig';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);
  const [user, setUser] = useState(null);
  const [currentUser] = useState('User');
  const [currentDateTime] = useState('2025-03-22 16:04:53');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusFormData, setStatusFormData] = useState({
    enrollment_status: 'planning',
    target_universities: '',
    applied_universities: '',
    accepted_universities: '',
    enrolled_university: '',
    study_program: '',
    admission_year: '',
    scholarship_status: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const userResponse = await axios.get('/api/user/profile');
        setUser(userResponse.data);
        
        // Fetch application data
        const appResponse = await axios.get('/api/get-application');
        setApplication(appResponse.data);
        
        // Initialize status form data with current values
        if (appResponse.data) {
          setStatusFormData({
            enrollment_status: appResponse.data.enrollment_status || 'planning',
            target_universities: appResponse.data.target_universities || '',
            applied_universities: appResponse.data.applied_universities || '',
            accepted_universities: appResponse.data.accepted_universities || '',
            enrolled_university: appResponse.data.enrolled_university || '',
            study_program: appResponse.data.study_program || '',
            admission_year: appResponse.data.admission_year || '',
            scholarship_status: appResponse.data.scholarship_status || ''
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Handle input change in the status update form
  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;
    setStatusFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit status update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    setUpdateError('');
    setUpdateSuccess('');
    
    try {
      // Convert admission_year to number if present
      const formData = { ...statusFormData };
      if (formData.admission_year) {
        formData.admission_year = parseInt(formData.admission_year, 10);
      }
      
      // Make the API call to update status
      await axios.put(`/api/update-application-status/${application.id}`, formData);
      
      // Update the local application data
      setApplication(prev => ({
        ...prev,
        ...formData
      }));
      
      setUpdateSuccess('Application status updated successfully!');
      setTimeout(() => {
        setShowStatusModal(false);
        setUpdateSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error updating status:', error);
      setUpdateError('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{
        background: '#f8f9fa'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container-fluid py-4 px-4 px-md-5">
      {/* Page header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="h3 fw-light mb-1" style={{ letterSpacing: '-0.5px' }}>
            Welcome, <span className="fw-bold">{user?.first_name || currentUser}</span>
          </h1>
          <p className="text-muted">Manage your PhD application and track your university status</p>
        </div>
        <div className="col-md-4 text-end d-flex justify-content-md-end mt-3 mt-md-0">
          <button 
            className="btn"
            style={{ 
              backgroundColor: 'rgba(13, 110, 253, 0.1)', 
              color: '#0d6efd',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              padding: '0.75rem 1.5rem',
              marginRight: '0.75rem'
            }}
            onClick={() => setShowStatusModal(true)}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            Update Status
          </button>
          {application ? (
            <Link 
              to="/edit-application" 
              className="btn"
              style={{ 
                backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                color: '#ffc107',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                padding: '0.75rem 1.5rem'
              }}
            >
              <i className="bi bi-pencil me-2"></i>
              Edit Application
            </Link>
          ) : (
            <Link 
              to="/new-application" 
              className="btn"
              style={{ 
                backgroundColor: 'rgba(25, 135, 84, 0.1)', 
                color: '#198754',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                padding: '0.75rem 1.5rem'
              }}
            >
              <i className="bi bi-plus-lg me-2"></i>
              New Application
            </Link>
          )}
        </div>
      </div>
      
      {/* Error display */}
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
      
      {!application && !error && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-body p-4 text-center">
            <div className="py-5">
              <div className="display-6 text-muted mb-4">
                <i className="bi bi-file-earmark-plus"></i>
              </div>
              <h3 className="h4 mb-3">No Application Found</h3>
              <p className="text-muted mb-4">You haven't submitted a PhD application yet. Get started by creating a new application.</p>
              <Link 
                to="/new-application" 
                className="btn btn-primary px-4 py-2"
                style={{ 
                  borderRadius: '8px',
                  boxShadow: '0 3px 6px rgba(13, 110, 253, 0.15)'
                }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Create Application
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {application && (
        <>
          {/* Status Card */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header py-3 bg-white border-bottom">
              <div className="d-flex align-items-center">
                <i className="bi bi-flag-fill text-primary me-2"></i>
                <h3 className="h5 mb-0">Application Status</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-4 mb-3 mb-md-0">
                  <div className="d-flex align-items-center">
                    <div className="status-indicator me-3" style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: getStatusColor(application.enrollment_status).bgLight,
                      color: getStatusColor(application.enrollment_status).color,
                      fontSize: '1.5rem'
                    }}>
                      <i className={getStatusColor(application.enrollment_status).icon}></i>
                    </div>
                    <div>
                      <div className="small text-muted">Current Status</div>
                      <div className="h5 mb-0" style={{ color: getStatusColor(application.enrollment_status).color }}>
                        {getStatusText(application.enrollment_status)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-8">
                  <div className="position-relative">
                    <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                      <div className="progress-bar bg-success" role="progressbar" style={{ width: getProgressWidth(application.enrollment_status) }} aria-valuenow={getProgressValue(application.enrollment_status)} aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <div className={`small ${application.enrollment_status === 'planning' ? 'fw-bold' : ''}`}>Planning</div>
                      <div className={`small ${application.enrollment_status === 'applied' ? 'fw-bold' : ''}`}>Applied</div>
                      <div className={`small ${application.enrollment_status === 'accepted' ? 'fw-bold' : ''}`}>Accepted</div>
                      <div className={`small ${application.enrollment_status === 'enrolled' ? 'fw-bold' : ''}`}>Enrolled</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <hr className="my-4" style={{ opacity: '0.1' }} />
              
              <div className="row g-4">
                {application.enrollment_status === 'enrolled' && application.enrolled_university && (
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                        <i className="bi bi-building text-success"></i>
                      </div>
                      <div>
                        <div className="small text-muted">Enrolled at</div>
                        <div className="fw-bold">{application.enrolled_university}</div>
                        <div className="small text-muted">
                          {application.study_program && `${application.study_program}`}
                          {application.admission_year && ` • ${application.admission_year}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                      <i className="bi bi-list-check text-primary"></i>
                    </div>
                    <div>
                      <div className="small text-muted">Target Universities</div>
                      <div className="fw-bold">
                        {application.target_universities ? (
                          <div style={{ maxHeight: '50px', overflow: 'auto' }}>
                            {application.target_universities}
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">None specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {application.enrollment_status === 'enrolled' && application.scholarship_status && (
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
                        <i className="bi bi-award text-warning"></i>
                      </div>
                      <div>
                        <div className="small text-muted">Scholarship Status</div>
                        <div className="fw-bold">
                          {application.scholarship_status === 'full' ? (
                            <span className="badge bg-success">Full Scholarship</span>
                          ) : application.scholarship_status === 'partial' ? (
                            <span className="badge bg-warning text-dark">Partial Scholarship</span>
                          ) : (
                            <span className="badge bg-light text-dark">No Scholarship</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-end mt-4">
                <button 
                  className="btn btn-sm"
                  style={{ 
                    backgroundColor: 'rgba(13, 110, 253, 0.1)', 
                    color: '#0d6efd',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    padding: '0.5rem 1rem'
                  }}
                  onClick={() => setShowStatusModal(true)}
                >
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Update Status
                </button>
              </div>
            </div>
          </div>
          
          {/* Application Overview Card */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header py-3 bg-white border-bottom">
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark-text text-primary me-2"></i>
                <h3 className="h5 mb-0">Application Overview</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="small text-muted mb-1">Personal Information</div>
                  <table className="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td style={{ width: '40%' }} className="text-muted">Name</td>
                        <td className="fw-medium">{application.first_name} {application.middle_name ? `${application.middle_name} ` : ''}{application.last_name}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Contact Number</td>
                        <td className="fw-medium">{application.contact_number}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Email</td>
                        <td className="fw-medium">{application.email}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Gender</td>
                        <td className="fw-medium">{application.gender}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="col-md-6">
                  <div className="small text-muted mb-1">Academic Information</div>
                  <table className="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td style={{ width: '40%' }} className="text-muted">Final Percentage</td>
                        <td className="fw-medium">{application.final_percentage}%</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Ranking</td>
                        <td className="fw-medium">{application.tentative_ranking}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">English Proficiency</td>
                        <td className="fw-medium">{application.english_proficiency}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Availability</td>
                        <td className="fw-medium">{formatDate(application.availability_to_start)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="col-12">
                  <div className="text-end mt-3">
                    <Link 
                      to="/view-application" 
                      className="btn btn-sm"
                      style={{ 
                        backgroundColor: 'rgba(25, 135, 84, 0.1)', 
                        color: '#198754',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        padding: '0.5rem 1rem'
                      }}
                    >
                      <i className="bi bi-eye me-2"></i>
                      View Full Application
                    </Link>
                    <Link 
                      to="/edit-application" 
                      className="btn btn-sm ms-2"
                      style={{ 
                        backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                        color: '#ffc107',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        padding: '0.5rem 1rem'
                      }}
                    >
                      <i className="bi bi-pencil me-2"></i>
                      Edit Application
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Documents Card */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header py-3 bg-white border-bottom">
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
                <h3 className="h5 mb-0">Uploaded Documents</h3>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '30%' }} className="ps-4">Document Type</th>
                      <th style={{ width: '40%' }}>Status</th>
                      <th style={{ width: '30%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-file-earmark-text text-primary me-2"></i>
                          <span>Academic Transcript</span>
                        </div>
                      </td>
                      <td>
                        {application.transcript ? (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i> Uploaded
                          </span>
                        ) : (
                          <span className="badge bg-danger">
                            <i className="bi bi-x-circle me-1"></i> Missing
                          </span>
                        )}
                      </td>
                      <td>
                        {application.transcript ? (
                          <div>
                            <button 
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => handleDownloadFile(application.transcript, 'transcript')}
                            >
                              <i className="bi bi-download me-1"></i> Download
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleViewFile(application.transcript, 'transcript')}
                            >
                              <i className="bi bi-eye me-1"></i> View
                            </button>
                          </div>
                        ) : (
                          <Link to="/edit-application" className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-upload me-1"></i> Upload
                          </Link>
                        )}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-file-earmark-person text-success me-2"></i>
                          <span>Curriculum Vitae</span>
                        </div>
                      </td>
                      <td>
                        {application.cv ? (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i> Uploaded
                          </span>
                        ) : (
                          <span className="badge bg-danger">
                            <i className="bi bi-x-circle me-1"></i> Missing
                          </span>
                        )}
                      </td>
                      <td>
                        {application.cv ? (
                          <div>
                            <button 
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => handleDownloadFile(application.cv, 'cv')}
                            >
                              <i className="bi bi-download me-1"></i> Download
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleViewFile(application.cv, 'cv')}
                            >
                              <i className="bi bi-eye me-1"></i> View
                            </button>
                          </div>
                        ) : (
                          <Link to="/edit-application" className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-upload me-1"></i> Upload
                          </Link>
                        )}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-image text-warning me-2"></i>
                          <span>Photo</span>
                        </div>
                      </td>
                      <td>
                        {application.photo ? (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i> Uploaded
                          </span>
                        ) : (
                          <span className="badge bg-danger">
                            <i className="bi bi-x-circle me-1"></i> Missing
                          </span>
                        )}
                      </td>
                      <td>
                        {application.photo ? (
                          <div>
                            <button 
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => handleDownloadFile(application.photo, 'photo')}
                            >
                              <i className="bi bi-download me-1"></i> Download
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleViewFile(application.photo, 'photo')}
                            >
                              <i className="bi bi-eye me-1"></i> View
                            </button>
                          </div>
                        ) : (
                          <Link to="/edit-application" className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-upload me-1"></i> Upload
                          </Link>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Last Updated Info */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="small text-muted mb-1">Created on</div>
                  <div className="fw-medium">{application.created_at}</div>
                </div>
                <div className="col-md-6">
                  <div className="small text-muted mb-1">Last updated</div>
                  <div className="fw-medium">{application.updated_at}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Current User Info */}
      <div className="small text-muted text-center mb-4">
        You are logged in as <span className="fw-bold">{currentUser}</span> • {currentDateTime}
      </div>
      
      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
                <h5 className="modal-title">
                  <i className="bi bi-arrow-repeat text-primary me-2"></i>
                  Update Application Status
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)}></button>
              </div>
              <form onSubmit={handleStatusUpdate}>
                <div className="modal-body">
                  {updateError && (
                    <div className="alert alert-danger py-2 px-3 mb-3" style={{
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      border: 'none',
                      backgroundColor: 'rgba(220, 53, 69, 0.1)'
                    }}>
                      <i className="bi bi-exclamation-circle me-2"></i>{updateError}
                    </div>
                  )}
                  
                  {updateSuccess && (
                    <div className="alert alert-success py-2 px-3 mb-3" style={{
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      border: 'none',
                      backgroundColor: 'rgba(25, 135, 84, 0.1)'
                    }}>
                      <i className="bi bi-check-circle me-2"></i>{updateSuccess}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="enrollment_status" className="form-label">Current Status</label>
                    <select
                      className="form-select"
                      id="enrollment_status"
                      name="enrollment_status"
                      value={statusFormData.enrollment_status}
                      onChange={handleStatusFormChange}
                      required
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="planning">Planning to Apply</option>
                      <option value="applied">Applied to Universities</option>
                      <option value="accepted">Accepted by Universities</option>
                      <option value="enrolled">Enrolled in University</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="target_universities" className="form-label">Target Universities</label>
                    <textarea
                      className="form-control"
                      id="target_universities"
                      name="target_universities"
                      rows="2"
                      value={statusFormData.target_universities}
                      onChange={handleStatusFormChange}
                      placeholder="List universities you are interested in (comma separated)"
                      style={{ borderRadius: '8px' }}
                    ></textarea>
                  </div>
                  
                  {statusFormData.enrollment_status !== 'planning' && (
                    <div className="mb-3">
                      <label htmlFor="applied_universities" className="form-label">Applied Universities</label>
                      <textarea
                        className="form-control"
                        id="applied_universities"
                        name="applied_universities"
                        rows="2"
                        value={statusFormData.applied_universities}
                        onChange={handleStatusFormChange}
                        placeholder="List universities where you've submitted applications"
                        style={{ borderRadius: '8px' }}
                      ></textarea>
                    </div>
                  )}
                  
                  {['accepted', 'enrolled'].includes(statusFormData.enrollment_status) && (
                    <div className="mb-3">
                      <label htmlFor="accepted_universities" className="form-label">Accepted By</label>
                      <textarea
                        className="form-control"
                        id="accepted_universities"
                        name="accepted_universities"
                        rows="2"
                        value={statusFormData.accepted_universities}
                        onChange={handleStatusFormChange}
                        placeholder="List universities that have accepted your application"
                        style={{ borderRadius: '8px' }}
                      ></textarea>
                    </div>
                  )}
                  
                  {statusFormData.enrollment_status === 'enrolled' && (
                    <>
                      <div className="mb-3">
                        <label htmlFor="enrolled_university" className="form-label">Enrolled University</label>
                        <input
                          type="text"
                          className="form-control"
                          id="enrolled_university"
                          name="enrolled_university"
                          value={statusFormData.enrolled_university}
                          onChange={handleStatusFormChange}
                          placeholder="Name of university where you've enrolled"
                          required={statusFormData.enrollment_status === 'enrolled'}
                          style={{ borderRadius: '8px' }}
                        />
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="study_program" className="form-label">Program of Study</label>
                            <input
                              type="text"
                              className="form-control"
                              id="study_program"
                              name="study_program"
                              value={statusFormData.study_program}
                              onChange={handleStatusFormChange}
                              placeholder="e.g., Computer Science PhD"
                              style={{ borderRadius: '8px' }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="admission_year" className="form-label">Year of Admission</label>
                            <input
                              type="number"
                              className="form-control"
                              id="admission_year"
                              name="admission_year"
                              value={statusFormData.admission_year}
                              onChange={handleStatusFormChange}
                              placeholder="e.g., 2025"
                              min="2020"
                              max="2030"
                              style={{ borderRadius: '8px' }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="scholarship_status" className="form-label">Scholarship Status</label>
                        <select
                          className="form-select"
                          id="scholarship_status"
                          name="scholarship_status"
                          value={statusFormData.scholarship_status}
                          onChange={handleStatusFormChange}
                          style={{ borderRadius: '8px' }}
                        >
                          <option value="">Select an option</option>
                          <option value="none">No Scholarship</option>
                          <option value="partial">Partial Scholarship</option>
                          <option value="full">Full Scholarship</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      <>Update Status</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get status color and icon
const getStatusColor = (status) => {
  switch(status) {
    case 'planning':
      return { color: '#6c757d', bgLight: 'rgba(108, 117, 125, 0.1)', icon: 'bi-hourglass' };
    case 'applied':
      return { color: '#0d6efd', bgLight: 'rgba(13, 110, 253, 0.1)', icon: 'bi-send' };
    case 'accepted':
      return { color: '#ffc107', bgLight: 'rgba(255, 193, 7, 0.1)', icon: 'bi-check-circle' };
    case 'enrolled':
      return { color: '#198754', bgLight: 'rgba(25, 135, 84, 0.1)', icon: 'bi-mortarboard-fill' };
    default:
      return { color: '#6c757d', bgLight: 'rgba(108, 117, 125, 0.1)', icon: 'bi-question-circle' };
  }
};

// Helper function to get status text
const getStatusText = (status) => {
  switch(status) {
    case 'planning':
      return 'Planning to Apply';
    case 'applied':
      return 'Applied to Universities';
    case 'accepted':
      return 'Accepted by Universities';
    case 'enrolled':
      return 'Enrolled in University';
    default:
      return 'Unknown Status';
  }
};

// Helper function to get progress width for progress bar
const getProgressWidth = (status) => {
  switch(status) {
    case 'planning':
      return '25%';
    case 'applied':
      return '50%';
    case 'accepted':
      return '75%';
    case 'enrolled':
      return '100%';
    default:
      return '0%';
  }
};

// Helper function to get progress value for aria-valuenow
const getProgressValue = (status) => {
  switch(status) {
    case 'planning':
      return 25;
    case 'applied':
      return 50;
    case 'accepted':
      return 75;
    case 'enrolled':
      return 100;
    default:
      return 0;
  }
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  
  // Check if it's a date string
  if (dateString.includes('-')) {
    try {
      const [year, month, day] = dateString.split('-');
      return `${month}/${day}/${year}`;
    } catch (e) {
      return dateString;
    }
  }
  
  return dateString;
};

// Helper function to handle file download
const handleDownloadFile = async (fileId, fileType) => {
  if (!fileId) return;
  
  try {
    // Request file download by ID with responseType blob
    const response = await axios.get(`/api/files/${fileId}/download`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename based on file type
    const fileName = `${fileType}_document${getDefaultExtension(fileType)}`;
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error(`Error downloading ${fileType}:`, error);
    alert(`Failed to download ${fileType}. Please try again later.`);
  }
};

// Helper function to handle file view
const handleViewFile = async (fileId, fileType) => {
  if (!fileId) return;
  
  try {
    // Open file in new tab
    window.open(`/api/files/${fileId}/view`, '_blank');
  } catch (error) {
    console.error(`Error viewing ${fileType}:`, error);
    alert(`Failed to view ${fileType}. Please try again later.`);
  }
};

// Helper function to get default extension based on file type
const getDefaultExtension = (fileType) => {
  switch(fileType) {
    case 'transcript':
    case 'cv':
      return '.pdf';
    case 'photo':
      return '.jpg';
    default:
      return '';
  }
};

export default UserDashboard;