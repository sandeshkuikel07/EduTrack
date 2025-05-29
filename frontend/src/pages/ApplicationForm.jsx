import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axiosConfig';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Personal Details
    first_name: '',
    middle_name: '',
    last_name: '',
    contact_number: '',
    gender: '',
    email: '',
    
    // Academic Details
    final_percentage: '',
    tentative_ranking: '',
    final_year_project: '',
    other_projects: '',
    publications: '',
    
    // University Status Fields
    target_universities: '',
    applied_universities: '',
    accepted_universities: '',
    enrolled_university: '',
    enrollment_status: 'planning', // 'planning', 'applied', 'accepted', 'enrolled'
    study_program: '',
    admission_year: '',
    scholarship_status: '',
    
    // Additional Information
    extracurricular: '',
    professional_experience: '',
    strong_points: '',
    weak_points: '',
    preferred_programs: '',
    references: '',
    statement_of_purpose: '',
    intended_research_areas: '',
    english_proficiency: '',
    leadership_experience: '',
    availability_to_start: '',
    additional_certifications: ''
  });
  
  const [fileData, setFileData] = useState({
    transcript: null,
    cv: null,
    photo: null
  });
  
  const [filePaths, setFilePaths] = useState({
    transcript: '',
    cv: '',
    photo: ''
  });
  
  const [uploadProgress, setUploadProgress] = useState({
    transcript: 0,
    cv: 0,
    photo: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingApplication, setExistingApplication] = useState(false);
  const [currentUser] = useState('User');
  const [currentDateTime] = useState('2025-03-22 15:54:44');
  
  // Fetch existing application data if available
  useEffect(() => {
    const fetchExistingApplication = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/get-application');
        
        // Update form data with existing application data
        setFormData(response.data);
        
        // Set file paths for existing uploads
        setFilePaths({
          transcript: response.data.transcript || '',
          cv: response.data.cv || '',
          photo: response.data.photo || ''
        });
        
        setExistingApplication(true);
        setLoading(false);
      } catch (error) {
        console.log('No existing application found or error fetching:', error);
        setLoading(false);
      }
    };
    
    fetchExistingApplication();
  }, []);
  
  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      // Store the selected file
      setFileData(prevState => ({
        ...prevState,
        [name]: files[0]
      }));
      
      // Reset progress for this file
      setUploadProgress(prevState => ({
        ...prevState,
        [name]: 0
      }));
    }
  };
  
  // Upload a file and return the file ID
  const uploadFile = async (file, type) => {
    if (!file) return filePaths[type] || null;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    try {
      const response = await axios.post('/api/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            [type]: percentCompleted
          }));
        }
      });
      
      // Reset progress after successful upload
      setUploadProgress(prev => ({
        ...prev,
        [type]: 0
      }));
      
      return response.data.fileId; // Store file ID instead of path
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      throw error;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Starting form submission...');
      
      // Create a submission data object with proper types
      const submissionData = { ...formData };
      
      // Convert numeric fields to numbers
      if (submissionData.final_percentage) {
        submissionData.final_percentage = parseFloat(submissionData.final_percentage);
      }
      
      if (submissionData.admission_year && submissionData.admission_year !== '') {
        submissionData.admission_year = parseInt(submissionData.admission_year, 10);
      }
      
      // Upload files first if they exist
      console.log('Uploading files...');
      
      if (fileData.transcript) {
        console.log('Uploading transcript...');
        submissionData.transcript = await uploadFile(fileData.transcript, 'transcript');
      }
      
      if (fileData.cv) {
        console.log('Uploading CV...');
        submissionData.cv = await uploadFile(fileData.cv, 'cv');
      }
      
      if (fileData.photo) {
        console.log('Uploading photo...');
        submissionData.photo = await uploadFile(fileData.photo, 'photo');
      }
      
      console.log('Files uploaded successfully. Submitting application data...');
      
      // Submit the application data
      const response = await axios.post('/api/submit-application', submissionData);
      
      console.log('Application submitted successfully:', response.data);
      setSuccess('Application submitted successfully!');
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
      
      // Redirect to dashboard after short delay
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      
      let errorMessage = 'An error occurred while submitting your application.';
      
      if (error.response) {
        errorMessage = `Server error: ${error.response.data?.message || error.response.statusText || 'Unknown error'}`;
        console.error('Error response:', error.response);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
        console.error('Error request:', error.request);
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
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
          <p className="text-muted">Loading application form...</p>
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
            {existingApplication ? 'Update' : 'Submit'} <span className="fw-bold">Application</span>
          </h1>
          <p className="text-muted">Please fill out all required fields</p>
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
      
      <form onSubmit={handleSubmit}>
        {/* Personal Details Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-person-fill text-primary me-2"></i>
              <h3 className="h5 mb-0">Personal Details</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="first_name"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="first_name">First Name <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="middle_name"
                    name="middle_name"
                    placeholder="Middle Name"
                    value={formData.middle_name}
                    onChange={handleChange}
                  />
                  <label htmlFor="middle_name">Middle Name</label>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="last_name"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="last_name">Last Name <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="tel"
                    className="form-control"
                    id="contact_number"
                    name="contact_number"
                    placeholder="Contact Number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="contact_number">Contact Number <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <label htmlFor="gender">Gender <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-12">
                <div className="form-floating">
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="email">Email Address <span className="text-danger">*</span></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* University Status Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-building text-primary me-2"></i>
              <h3 className="h5 mb-0">University Status</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="enrollment_status"
                    name="enrollment_status"
                    value={formData.enrollment_status || 'planning'}
                    onChange={handleChange}
                    required
                  >
                    <option value="planning">Planning to Apply</option>
                    <option value="applied">Applied to Universities</option>
                    <option value="accepted">Accepted by Universities</option>
                    <option value="enrolled">Enrolled in University</option>
                  </select>
                  <label htmlFor="enrollment_status">Current Status <span className="text-danger">*</span></label>
                </div>
              </div>
              
              {formData.enrollment_status === 'enrolled' && (
                <div className="col-md-6">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      id="enrolled_university"
                      name="enrolled_university"
                      placeholder="Name of university"
                      value={formData.enrolled_university || ''}
                      onChange={handleChange}
                      required={formData.enrollment_status === 'enrolled'}
                    />
                    <label htmlFor="enrolled_university">Enrolled University <span className="text-danger">*</span></label>
                  </div>
                </div>
              )}
              
              <div className="col-12">
                <label htmlFor="target_universities" className="form-label">
                  Target Universities <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="target_universities"
                  name="target_universities"
                  rows="2"
                  value={formData.target_universities || ''}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                  placeholder="List universities you are interested in (comma separated)"
                ></textarea>
                <div className="form-text">List universities you're interested in applying to (separate with commas)</div>
              </div>
              
              {formData.enrollment_status !== 'planning' && (
                <div className="col-12">
                  <label htmlFor="applied_universities" className="form-label">
                    Applied Universities
                  </label>
                  <textarea
                    className="form-control"
                    id="applied_universities"
                    name="applied_universities"
                    rows="2"
                    value={formData.applied_universities || ''}
                    onChange={handleChange}
                    style={{ borderRadius: '8px' }}
                    placeholder="List universities where you've submitted applications (comma separated)"
                  ></textarea>
                  <div className="form-text">List universities where you've submitted applications</div>
                </div>
              )}
              
              {['accepted', 'enrolled'].includes(formData.enrollment_status) && (
                <div className="col-12">
                  <label htmlFor="accepted_universities" className="form-label">
                    Accepted By
                  </label>
                  <textarea
                    className="form-control"
                    id="accepted_universities"
                    name="accepted_universities"
                    rows="2"
                    value={formData.accepted_universities || ''}
                    onChange={handleChange}
                    style={{ borderRadius: '8px' }}
                    placeholder="List universities that have accepted you (comma separated)"
                  ></textarea>
                  <div className="form-text">List universities that have accepted your application</div>
                </div>
              )}
              
              {formData.enrollment_status === 'enrolled' && (
                <>
                  <div className="col-md-4">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="study_program"
                        name="study_program"
                        placeholder="Program name"
                        value={formData.study_program || ''}
                        onChange={handleChange}
                      />
                      <label htmlFor="study_program">Program of Study</label>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-floating">
                      <input
                        type="number"
                        className="form-control"
                        id="admission_year"
                        name="admission_year"
                        placeholder="Year"
                        value={formData.admission_year || ''}
                        onChange={handleChange}
                        min="2020"
                        max="2030"
                      />
                      <label htmlFor="admission_year">Year of Admission</label>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-floating">
                      <select
                        className="form-select"
                        id="scholarship_status"
                        name="scholarship_status"
                        value={formData.scholarship_status || ''}
                        onChange={handleChange}
                      >
                        <option value="">Select an option</option>
                        <option value="none">No Scholarship</option>
                        <option value="partial">Partial Scholarship</option>
                        <option value="full">Full Scholarship</option>
                      </select>
                      <label htmlFor="scholarship_status">Scholarship Status</label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Academic Details Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-mortarboard-fill text-primary me-2"></i>
              <h3 className="h5 mb-0">Academic Details</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="final_percentage"
                    name="final_percentage"
                    placeholder="Final Percentage"
                    value={formData.final_percentage}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                  />
                  <label htmlFor="final_percentage">Final Percentage Score <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="tentative_ranking"
                    name="tentative_ranking"
                    value={formData.tentative_ranking}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Top 5%">Top 5%</option>
                    <option value="Top 10%">Top 10%</option>
                    <option value="Top 20%">Top 20%</option>
                    <option value="Top 30%">Top 30%</option>
                    <option value="Top 40%">Top 40%</option>
                  </select>
                  <label htmlFor="tentative_ranking">Tentative Ranking <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-12">
                <label htmlFor="final_year_project" className="form-label">
                  Final Year Project Details <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="final_year_project"
                  name="final_year_project"
                  rows="4"
                  value={formData.final_year_project}
                  onChange={handleChange}
                  required
                  minLength="50"
                  style={{ borderRadius: '8px' }}
                  placeholder="Describe your final year project in detail"
                ></textarea>
                <div className="form-text">Provide a detailed description of your final year project (min 50 characters)</div>
              </div>
              
              <div className="col-12">
                <label htmlFor="other_projects" className="form-label">
                  Other Notable Research or Project Work
                </label>
                <textarea
                  className="form-control"
                  id="other_projects"
                  name="other_projects"
                  rows="3"
                  value={formData.other_projects}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                  placeholder="Describe any other notable research or projects you've worked on"
                ></textarea>
              </div>
              
              <div className="col-12">
                <label htmlFor="publications" className="form-label">
                  Publications
                </label>
                <textarea
                  className="form-control"
                  id="publications"
                  name="publications"
                  rows="3"
                  value={formData.publications}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                  placeholder="List any academic publications you've authored or co-authored"
                ></textarea>
                <div className="form-text">List any academic or research publications you have authored</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* File Uploads Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
              <h3 className="h5 mb-0">Documents</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label htmlFor="transcript" className="form-label">
                  Academic Transcript <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="transcript"
                  name="transcript"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  required={!filePaths.transcript}
                  style={{ borderRadius: '8px' }}
                />
                {uploadProgress.transcript > 0 && (
                  <div className="progress mt-2" style={{ height: '5px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${uploadProgress.transcript}%` }}
                      aria-valuenow={uploadProgress.transcript} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                )}
                {filePaths.transcript && (
                  <div className="mt-2">
                    <small className="text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      File already uploaded
                    </small>
                  </div>
                )}
                <div className="form-text">Upload your academic transcript (PDF, DOC, DOCX)</div>
              </div>
              
              <div className="col-md-4">
                <label htmlFor="cv" className="form-label">
                  Curriculum Vitae (CV) <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="cv"
                  name="cv"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  required={!filePaths.cv}
                  style={{ borderRadius: '8px' }}
                />
                {uploadProgress.cv > 0 && (
                  <div className="progress mt-2" style={{ height: '5px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${uploadProgress.cv}%` }}
                      aria-valuenow={uploadProgress.cv} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                )}
                {filePaths.cv && (
                  <div className="mt-2">
                    <small className="text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      File already uploaded
                    </small>
                  </div>
                )}
                <div className="form-text">Upload your CV (PDF, DOC, DOCX)</div>
              </div>
              
              <div className="col-md-4">
                <label htmlFor="photo" className="form-label">
                  Photo <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="photo"
                  name="photo"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png"
                  required={!filePaths.photo}
                  style={{ borderRadius: '8px' }}
                />
                {uploadProgress.photo > 0 && (
                  <div className="progress mt-2" style={{ height: '5px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${uploadProgress.photo}%` }}
                      aria-valuenow={uploadProgress.photo} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                )}
                {filePaths.photo && (
                  <div className="mt-2">
                    <small className="text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      File already uploaded
                    </small>
                  </div>
                )}
                <div className="form-text">Upload a recent photo (JPG, JPEG, PNG)</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Strengths & Weaknesses Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-clipboard-check text-primary me-2"></i>
              <h3 className="h5 mb-0">Strengths & Weaknesses</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="strong_points" className="form-label">
                  Strong Points <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="strong_points"
                  name="strong_points"
                  rows="4"
                  value={formData.strong_points}
                  onChange={handleChange}
                  required
                  style={{ 
                    borderRadius: '8px',
                    borderColor: '#d1e7dd',
                    backgroundColor: 'rgba(25, 135, 84, 0.03)'
                  }}
                  placeholder="Describe your academic and personal strengths"
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="weak_points" className="form-label">
                  Weak Points <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="weak_points"
                  name="weak_points"
                  rows="4"
                  value={formData.weak_points}
                  onChange={handleChange}
                  required
                  style={{ 
                    borderRadius: '8px',
                    borderColor: '#f8d7da',
                    backgroundColor: 'rgba(220, 53, 69, 0.03)'
                  }}
                  placeholder="Describe areas where you need improvement"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Information Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle text-primary me-2"></i>
              <h3 className="h5 mb-0">Additional Information</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="extracurricular" className="form-label">
                  Notable Extracurricular Activities and Awards
                </label>
                <textarea
                  className="form-control"
                  id="extracurricular"
                  name="extracurricular"
                  rows="3"
                  value={formData.extracurricular}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                  placeholder="List your notable extracurricular activities and awards"
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="professional_experience" className="form-label">
                  Professional Experience
                </label>
                <textarea
                  className="form-control"
                  id="professional_experience"
                  name="professional_experience"
                  rows="3"
                  value={formData.professional_experience}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                  placeholder="Describe any relevant professional experience"
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="leadership_experience" className="form-label">
                  Leadership Experience <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="leadership_experience"
                  name="leadership_experience"
                  rows="3"
                  value={formData.leadership_experience}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                  placeholder="Describe your leadership experiences"
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="additional_certifications" className="form-label">
                  Additional Certifications
                </label>
                <textarea
                  className="form-control"
                  id="additional_certifications"
                  name="additional_certifications"
                  rows="3"
                  value={formData.additional_certifications}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                  placeholder="List any relevant certifications you've earned"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        {/* Academic Preferences Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-bookmark-star text-primary me-2"></i>
              <h3 className="h5 mb-0">Academic Preferences</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="preferred_programs" className="form-label">
                  Preferred Programs <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="preferred_programs"
                  name="preferred_programs"
                  rows="3"
                  value={formData.preferred_programs}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                  placeholder="List your preferred academic programs"
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="intended_research_areas" className="form-label">
                  Intended Research Areas <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="intended_research_areas"
                  name="intended_research_areas"
                  rows="3"
                  value={formData.intended_research_areas}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                  placeholder="Describe your intended areas of research"
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="english_proficiency"
                    name="english_proficiency"
                    value={formData.english_proficiency}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your proficiency level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Native/Fluent">Native/Fluent</option>
                  </select>
                  <label htmlFor="english_proficiency">English Proficiency <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="date"
                    className="form-control"
                    id="availability_to_start"
                    name="availability_to_start"
                    value={formData.availability_to_start}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="availability_to_start">Availability to Start <span className="text-danger">*</span></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statement of Purpose Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-file-earmark-text text-primary me-2"></i>
              <h3 className="h5 mb-0">Statement of Purpose</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <div className="mb-2">
                  <span className="badge bg-primary">Required</span>
                  <span className="badge bg-light text-dark ms-2">Min 100 characters</span>
                </div>
                <textarea
                  className="form-control"
                  id="statement_of_purpose"
                  name="statement_of_purpose"
                  rows="6"
                  value={formData.statement_of_purpose}
                  onChange={handleChange}
                  required
                  minLength="100"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    padding: '12px 15px'
                  }}
                  placeholder="Write your statement of purpose explaining your motivation, academic interests, and career goals"
                ></textarea>
                <div className="form-text">
                  Explain your motivation for applying, your academic interests, and your career goals. This should be a thoughtful and comprehensive statement.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* References Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-person-lines-fill text-primary me-2"></i>
              <h3 className="h5 mb-0">References</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="references" className="form-label">
                  Academic or Professional References <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="references"
                  name="references"
                  rows="4"
                  value={formData.references}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                  placeholder="Provide names and contact information for your references"
                ></textarea>
                <div className="form-text">
                  Provide names, positions, and contact information of your references
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button 
            type="button" 
            className="btn"
            style={{ 
              backgroundColor: 'rgba(108, 117, 125, 0.1)', 
              color: '#6c757d',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              padding: '0.75rem 1.5rem'
            }}
            onClick={() => navigate('/dashboard')}
          >
            <i className="bi bi-x-lg me-2"></i>
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="btn"
            style={{ 
              backgroundColor: 'rgba(13, 110, 253, 0.1)', 
              color: '#0d6efd',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              padding: '0.75rem 1.5rem'
            }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {existingApplication ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                {existingApplication ? 'Update Application' : 'Submit Application'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;