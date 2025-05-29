import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../services/axiosConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ViewApplication = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUser] = useState('User');
  const [currentDateTime] = useState('2025-03-22 15:03:50');
  const [fileLoading, setFileLoading] = useState({
    transcript: false,
    cv: false,
    photo: false
  });
  const [fileInfo, setFileInfo] = useState({
    transcript: null,
    cv: null,
    photo: null
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await axios.get(`/api/get-application/${id}`);
        setApplication(response.data);
        setAdminNotes(response.data.admin_notes || '');

        // Fetch file information if file IDs exist
        if (response.data.transcript) {
          fetchFileInfo(response.data.transcript, 'transcript');
        }

        if (response.data.cv) {
          fetchFileInfo(response.data.cv, 'cv');
        }

        if (response.data.photo) {
          fetchFileInfo(response.data.photo, 'photo');
        }

        setLoading(false);
      } catch (error) {
        setError('Error fetching application: ' + (error.response?.data?.message || 'Unknown error'));
        setLoading(false);
      }
    };

    const fetchFileInfo = async (fileId, fileType) => {
      try {
        const response = await axios.get(`/api/files/${fileId}/info`);
        setFileInfo(prev => ({
          ...prev,
          [fileType]: response.data
        }));
      } catch (error) {
        console.error(`Error fetching ${fileType} info:`, error);
      }
    };

    fetchApplication();
  }, [id]);

  // Handle file download with proper error handling
  const handleFileDownload = async (fileId, fileType) => {
    if (!fileId) return;

    setFileLoading(prev => ({ ...prev, [fileType]: true }));

    try {
      // Request file download by ID with responseType blob
      const response = await axios.get(`/api/files/${fileId}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Set filename based on fileInfo if available, or use a default name
      const fileName = fileInfo[fileType]?.original_name ||
        `${application.first_name}_${application.last_name}_${fileType}${getDefaultExtension(fileType)}`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      setSuccess(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} downloaded successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error(`Error downloading ${fileType}:`, error);
      setError(`Failed to download ${fileType}. Please try again later.`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setFileLoading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  // Get default extension based on file type
  const getDefaultExtension = (fileType) => {
    switch (fileType) {
      case 'transcript':
      case 'cv':
        return '.pdf';
      case 'photo':
        return '.jpg';
      default:
        return '';
    }
  };

  // Handle file preview
  const handleFileView = async (fileId, fileType) => {
    if (!fileId) return;

    setFileLoading(prev => ({ ...prev, [fileType]: true }));

    try {
      // For direct preview in new tab
      window.open(`/api/files/${fileId}/view`, '_blank');

      // For embedded preview, use this instead:
      /*
      setPreviewFile({
        fileId,
        fileType,
        fileName: fileInfo[fileType]?.original_name || `${fileType} file`
      });
      setShowPreviewModal(true);
      */
    } catch (error) {
      console.error(`Error viewing ${fileType}:`, error);
      setError(`Failed to preview ${fileType}. Please try again later.`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setFileLoading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  // Get gender display
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

  // Get percentage display
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

  // Get enrollment status display
  const getEnrollmentStatusDisplay = (status) => {
    switch (status) {
      case 'planning':
        return { icon: 'bi-hourglass', color: '#6c757d', bgColor: '#f0f0f0', text: 'Planning to Apply' };
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

  // Save admin notes
  const saveAdminNotes = async () => {
    try {
      setSavingNotes(true);
      await axios.put(`/api/update-application-notes/${id}`, { admin_notes: adminNotes });
      setSuccess('Notes saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save notes: ' + (error.response?.data?.message || 'Unknown error'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setSavingNotes(false);
    }
  };

  // Update application status
  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      await axios.put(`/api/update-application/${id}`, { enrollment_status: newStatus });
      // Refresh application data
      const response = await axios.get(`/api/get-application/${id}`);
      setApplication(response.data);
      setSuccess(`Application status updated to ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update status: ' + (error.response?.data?.message || 'Unknown error'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = () => {
    setShowDeleteDialog(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  // Handle delete application
  const handleDeleteApplication = async () => {
    setApplication(prev => ({ ...prev, deleting: true }));

    try {
      // Call delete API endpoint
      await axios.delete(`/api/delete-application/${id}`);
      // Redirect to dashboard after successful deletion
      window.location.href = '/admin/dashboard';
    } catch (error) {
      setError(`Error deleting application: ${error.response?.data?.message || 'Unknown error'}`);
      setApplication(prev => ({ ...prev, deleting: false }));
      closeDeleteDialog();
      setTimeout(() => setError(''), 5000);
    }
  };

  // Generate PDF report
  const generateReport = () => {
    if (!application) return;

    setApplication(prev => ({ ...prev, generatingReport: true }));

    setTimeout(() => {
      try {
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
        doc.text(`Student: ${application.first_name || ''} ${application.last_name || ''}`, 20, 40);
        doc.text(`Contact: ${application.contact_number || ''}`, 20, 50);
        if (application.email) {
          doc.text(`Email: ${application.email}`, 20, 60);
        }

        // Add university status if available
        if (application.enrollment_status && application.enrollment_status !== 'planning') {
          let yPos = 70;

          doc.setFontSize(14);
          doc.setTextColor(13, 110, 253);
          doc.text('University Status', 20, yPos);
          yPos += 10;

          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);

          doc.text(`Status: ${getEnrollmentStatusDisplay(application.enrollment_status).text}`, 30, yPos);
          yPos += 10;

          if (application.enrollment_status === 'enrolled' && application.enrolled_university) {
            doc.text(`Enrolled at: ${application.enrolled_university}`, 30, yPos);
            yPos += 10;

            if (application.study_program) {
              doc.text(`Program: ${application.study_program}`, 30, yPos);
              yPos += 10;
            }

            if (application.admission_year) {
              doc.text(`Admission Year: ${application.admission_year}`, 30, yPos);
              yPos += 10;
            }

            if (application.scholarship_status) {
              let scholarshipText = 'Scholarship: ';
              if (application.scholarship_status === 'full') {
                scholarshipText += 'Full Scholarship';
              } else if (application.scholarship_status === 'partial') {
                scholarshipText += 'Partial Scholarship';
              } else {
                scholarshipText += 'No Scholarship';
              }
              doc.text(scholarshipText, 30, yPos);
              yPos += 10;
            }
          }

          if (application.target_universities) {
            doc.text('Target Universities:', 30, yPos);
            const targetLines = doc.splitTextToSize(application.target_universities, 150);
            doc.text(targetLines, 40, yPos + 7);
            yPos += (targetLines.length * 7) + 10;
          }

          if (application.applied_universities) {
            doc.text('Applied Universities:', 30, yPos);
            const appliedLines = doc.splitTextToSize(application.applied_universities, 150);
            doc.text(appliedLines, 40, yPos + 7);
            yPos += (appliedLines.length * 7) + 10;
          }

          if (application.accepted_universities) {
            doc.text('Accepted By:', 30, yPos);
            const acceptedLines = doc.splitTextToSize(application.accepted_universities, 150);
            doc.text(acceptedLines, 40, yPos + 7);
            yPos += (acceptedLines.length * 7) + 10;
          }
        }

        // Add academic details
        const acadYPos = application.enrollment_status && application.enrollment_status !== 'planning' ? 160 : 75;

        doc.setFontSize(14);
        doc.setTextColor(13, 110, 253);
        doc.text('Academic Details', 20, acadYPos);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Final Percentage:', 30, acadYPos + 10);
        doc.text(`${application.final_percentage || 'N/A'}%`, 130, acadYPos + 10);

        doc.text('Tentative Ranking:', 30, acadYPos + 20);
        doc.text(application.tentative_ranking || 'N/A', 130, acadYPos + 20);

        doc.text('English Proficiency:', 30, acadYPos + 30);
        doc.text(application.english_proficiency || 'N/A', 130, acadYPos + 30);

        doc.text('Preferred Programs:', 30, acadYPos + 40);
        const programLines = doc.splitTextToSize(application.preferred_programs || 'N/A', 70);
        doc.text(programLines, 130, acadYPos + 40);

        // Add strengths and weaknesses
        doc.setFontSize(14);
        doc.setTextColor(13, 110, 253);
        doc.text('Strengths & Weaknesses', 20, 230);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Strengths:', 20, 240);

        // Handle multiline text
        const strengthLines = doc.splitTextToSize(application.strong_points || 'N/A', 160);
        doc.text(strengthLines, 30, 247);

        doc.text('Weaknesses:', 20, 247 + (strengthLines.length * 7) + 10);

        const weaknessLines = doc.splitTextToSize(application.weak_points || 'N/A', 160);
        doc.text(weaknessLines, 30, 247 + (strengthLines.length * 7) + 17);

        // Add footer
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated by: ${currentUser}`, 20, 280);
        doc.text(`Generated on: ${currentDateTime}`, 20, 287);

        // Save the PDF with the correct filename format
        const fileName = `${application.first_name || 'unknown'}_${application.last_name || 'unknown'}_report.pdf`;
        doc.save(fileName);

        setApplication(prev => ({ ...prev, generatingReport: false }));
        setSuccess('Report generated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError(`Error generating report: ${error.message || 'Unknown error'}`);
        setApplication(prev => ({ ...prev, generatingReport: false }));
        setTimeout(() => setError(''), 5000);
      }
    }, 1000);
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
          <p className="text-muted">Loading application data...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="container-fluid py-4 px-4 px-md-5">
        <div className="alert alert-danger py-3 px-4 mb-4" style={{
          borderRadius: '12px',
          fontSize: '1rem',
          border: 'none',
          backgroundColor: 'rgba(220, 53, 69, 0.1)'
        }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill text-danger fs-3 me-3"></i>
            <div>
              <h5 className="mb-1">Error Loading Application</h5>
              <p className="mb-3">{error}</p>
              <Link
                to="/admin/dashboard"
                className="btn"
                style={{
                  backgroundColor: 'rgba(108, 117, 125, 0.1)',
                  color: '#6c757d',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  padding: '0.5rem 1rem'
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container-fluid py-4 px-4 px-md-5">
        <div className="alert alert-info py-2 px-3 mb-4" style={{
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: 'none',
          backgroundColor: 'rgba(13, 202, 240, 0.1)'
        }}>
          <i className="bi bi-info-circle me-2"></i>Application not found.
        </div>
      </div>
    );
  }

  const genderDisplay = application.gender ? getGenderDisplay(application.gender) : getGenderDisplay('');
  const percentageDisplay = getPercentageDisplay(application.final_percentage);
  const enrollmentStatusDisplay = getEnrollmentStatusDisplay(application.enrollment_status || 'planning');

  return (
    <div className="container-fluid py-4 px-4 px-md-5">
      {/* Page header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="h3 fw-light mb-0" style={{ letterSpacing: '-0.5px' }}>
            Application <span className="fw-bold">Details</span>
          </h1>
          <p className="text-muted">View and manage applicant information</p>
        </div>
      </div>

      {/* Status messages */}
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

      {/* Action buttons */}
      <div className="d-flex justify-content-end mb-4">
        <Link to="/admin/dashboard" className="btn btn-sm me-2" style={{
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          color: '#6c757d',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          padding: '0.5rem 1rem'
        }}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Dashboard
        </Link>
        <Link to={`/admin/edit-application/${id}`} className="btn btn-sm" style={{
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          color: '#ffc107',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          padding: '0.5rem 1rem'
        }}>
          <i className="bi bi-pencil me-2"></i>
          Edit Application
        </Link>
      </div>

      {/* Applicant Summary Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-person-badge-fill text-primary me-2"></i>
            <h3 className="h5 mb-0">Applicant Summary</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="d-flex">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                  <i className="bi bi-person fs-4 text-primary"></i>
                </div>
                <div>
                  <h4 className="h5 mb-1">{application.first_name} {application.middle_name ? `${application.middle_name} ` : ''}{application.last_name}</h4>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <div className="d-inline-block px-2 py-1 rounded" style={{ backgroundColor: genderDisplay.bgColor }}>
                      <i className={`bi ${genderDisplay.icon} me-1`} style={{ color: genderDisplay.color }}></i>
                      <span style={{ color: genderDisplay.color }}>{genderDisplay.text}</span>
                    </div>

                    <div className="d-inline-block px-2 py-1 rounded" style={{ backgroundColor: percentageDisplay.bgColor }}>
                      <span style={{ color: percentageDisplay.color, fontWeight: 'bold' }}>
                        {application.final_percentage}%
                      </span>
                      <span className="ms-1" style={{ color: percentageDisplay.textColor, fontSize: '0.8rem' }}>
                        ({percentageDisplay.text})
                      </span>
                    </div>

                    {application.tentative_ranking && (
                      <div className="d-inline-block px-2 py-1 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                        <i className="bi bi-trophy me-1 text-primary"></i>
                        <span className="text-primary">{application.tentative_ranking}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 mt-3 mt-md-0">
              <div className="d-flex">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                  <i className="bi bi-telephone fs-4 text-success"></i>
                </div>
                <div>
                  <h5 className="card-title mb-1">Contact Information</h5>
                  <p className="mb-1">{application.contact_number}</p>
                  {application.email && <p className="mb-0 text-primary">{application.email}</p>}
                </div>
              </div>
            </div>
          </div>

          <hr className="my-4" style={{ opacity: '0.1' }} />

          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="small text-muted mb-1">Application ID</div>
              <div className="fw-bold">#{application.id}</div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="small text-muted mb-1">Submission Date</div>
              <div className="fw-bold">{new Date(application.created_at).toLocaleDateString()}</div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="small text-muted mb-1">Gender</div>
              <div className="fw-bold">{application.gender}</div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="small text-muted mb-1">Availability</div>
              <div className="fw-bold">{application.availability_to_start || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* University Status Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="bi bi-building text-primary me-2"></i>
              <h3 className="h5 mb-0">University & Enrollment Status</h3>
            </div>
            <div className="dropdown">
              <button className="btn btn-sm btn-outline-primary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ borderRadius: '6px' }}
              >
                <i className="bi bi-arrow-repeat me-1"></i>
                Change Status
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: '8px' }}>
                <li><button className="dropdown-item" onClick={() => handleStatusChange('planning')}>Planning to Apply</button></li>
                <li><button className="dropdown-item" onClick={() => handleStatusChange('applied')}>Applied to Universities</button></li>
                <li><button className="dropdown-item" onClick={() => handleStatusChange('accepted')}>Accepted by Universities</button></li>
                <li><button className="dropdown-item" onClick={() => handleStatusChange('enrolled')}>Enrolled in University</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="d-flex">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: enrollmentStatusDisplay.bgColor }}>
                  <i className={`bi ${enrollmentStatusDisplay.icon} fs-4`} style={{ color: enrollmentStatusDisplay.color }}></i>
                </div>
                <div>
                  <h4 className="h5 mb-1">Current Status</h4>
                  <div className="d-inline-block px-3 py-2 rounded mt-2" style={{ backgroundColor: enrollmentStatusDisplay.bgColor }}>
                    <i className={`bi ${enrollmentStatusDisplay.icon} me-2`} style={{ color: enrollmentStatusDisplay.color }}></i>
                    <span style={{ color: enrollmentStatusDisplay.color }}>{enrollmentStatusDisplay.text}</span>
                  </div>
                </div>
              </div>
            </div>

            {application.enrollment_status === 'enrolled' && application.enrolled_university && (
              <div className="col-md-6 mt-3 mt-md-0">
                <div className="d-flex">
                  <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                    <i className="bi bi-mortarboard fs-4 text-success"></i>
                  </div>
                  <div>
                    <h5 className="card-title mb-1">Enrolled At</h5>
                    <p className="h5 mb-0 text-success">{application.enrolled_university}</p>
                    <p className="small text-muted mb-0">
                      {application.study_program && `${application.study_program} • `}
                      {application.admission_year && `Started ${application.admission_year}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="my-4" style={{ opacity: '0.1' }} />

          <div className="row g-4">
            <div className="col-md-6">
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-list-check text-primary me-2"></i>
                  <h5 className="mb-0">Target Universities</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.target_universities ? (
                    <ul className="mb-0 ps-3">
                      {application.target_universities.split(',').map((uni, index) => (
                        <li key={index}>{uni.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    'No target universities specified'
                  )}
                </div>
              </div>
            </div>

            {application.enrollment_status && application.enrollment_status !== 'planning' && (
              <div className="col-md-6">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-send text-primary me-2"></i>
                    <h5 className="mb-0">Applied Universities</h5>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                    {application.applied_universities ? (
                      <ul className="mb-0 ps-3">
                        {application.applied_universities.split(',').map((uni, index) => (
                          <li key={index}>{uni.trim()}</li>
                        ))}
                      </ul>
                    ) : (
                      'No applied universities specified'
                    )}
                  </div>
                </div>
              </div>
            )}

            {application.enrollment_status && ['accepted', 'enrolled'].includes(application.enrollment_status) && (
              <div className="col-md-6">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    <h5 className="mb-0">Accepted By</h5>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)' }}>
                    {application.accepted_universities ? (
                      <ul className="mb-0 ps-3">
                        {application.accepted_universities.split(',').map((uni, index) => (
                          <li key={index}>{uni.trim()}</li>
                        ))}
                      </ul>
                    ) : (
                      'No acceptances specified'
                    )}
                  </div>
                </div>
              </div>
            )}

            {application.enrollment_status === 'enrolled' && application.scholarship_status && (
              <div className="col-md-6">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-award text-warning me-2"></i>
                    <h5 className="mb-0">Scholarship Status</h5>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: 'rgba(255, 193, 7, 0.05)' }}>
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
            )}
          </div>
        </div>
      </div>

      {/* Academic Details Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-mortarboard-fill text-primary me-2"></i>
            <h3 className="h5 mb-0">Academic Details</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                    <i className="bi bi-graph-up text-primary"></i>
                  </div>
                  <h5 className="mb-0">Performance</h5>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="small text-muted mb-1">Final Percentage</div>
                    <div className="fw-bold d-flex align-items-center">
                      <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                        <div className="progress-bar" role="progressbar" style={{
                          width: `${Math.min(application.final_percentage, 100)}%`,
                          backgroundColor: percentageDisplay.color
                        }}></div>
                      </div>
                      <span>{application.final_percentage}%</span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="small text-muted mb-1">Tentative Ranking</div>
                    <div className="fw-bold">{application.tentative_ranking}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                    <i className="bi bi-translate text-success"></i>
                  </div>
                  <h5 className="mb-0">Skills & Proficiency</h5>
                </div>

                <div className="mb-3">
                  <div className="small text-muted mb-1">English Proficiency</div>
                  <div className="fw-bold">{application.english_proficiency || 'Not specified'}</div>
                </div>

                <div className="mb-0">
                  <div className="small text-muted mb-1">Preferred Programs</div>
                  <div className="fw-bold">{application.preferred_programs || 'Not specified'}</div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-laptop text-primary me-2"></i>
                  <h5 className="mb-0">Final Year Project</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.final_year_project || 'No final year project specified'}
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-journal-code text-primary me-2"></i>
                  <h5 className="mb-0">Other Projects</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.other_projects || 'No other projects mentioned'}
                </div>
              </div>

              <div className="mb-0">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-file-text text-primary me-2"></i>
                  <h5 className="mb-0">Publications</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.publications || 'No publications mentioned'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-clipboard-check text-primary me-2"></i>
            <h3 className="h5 mb-0">Strengths & Weaknesses</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-3 rounded h-100" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                    <i className="bi bi-check-circle text-success"></i>
                  </div>
                  <h5 className="mb-0">Strong Points</h5>
                </div>
                <div>{application.strong_points || 'No strong points specified'}</div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 rounded h-100" style={{ backgroundColor: 'rgba(220, 53, 69, 0.05)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
                    <i className="bi bi-exclamation-triangle text-danger"></i>
                  </div>
                  <h5 className="mb-0">Weak Points</h5>
                </div>
                <div>{application.weak_points || 'No weak points specified'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle text-primary me-2"></i>
            <h3 className="h5 mb-0">Additional Information</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-activity text-primary me-2"></i>
                  <h5 className="mb-0">Extracurricular Activities & Awards</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.extracurricular || 'No extracurricular activities mentioned'}
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-briefcase text-primary me-2"></i>
                  <h5 className="mb-0">Professional Experience</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.professional_experience || 'No professional experience mentioned'}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-people text-primary me-2"></i>
                  <h5 className="mb-0">Leadership Experience</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.leadership_experience || 'No leadership experience mentioned'}
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-patch-check text-primary me-2"></i>
                  <h5 className="mb-0">Additional Certifications</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.additional_certifications || 'No additional certifications mentioned'}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="mb-0">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-file-earmark-text text-primary me-2"></i>
                  <h5 className="mb-0">Statement of Purpose</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.statement_of_purpose || 'No statement of purpose provided'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research & References */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-search text-primary me-2"></i>
            <h3 className="h5 mb-0">Research & References</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-book text-primary me-2"></i>
                <h5 className="mb-0">Intended Research Areas</h5>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                {application.intended_research_areas || 'No specific research areas mentioned'}
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-person-lines-fill text-primary me-2"></i>
                <h5 className="mb-0">References</h5>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                {application.references || 'No references provided'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="bi bi-pencil-square text-primary me-2"></i>
              <h3 className="h5 mb-0">Admin Notes</h3>
            </div>
            <div>
              <span className="badge bg-secondary">Only visible to admins</span>
            </div>
          </div>
        </div>
        <div className="card-body">
          <textarea
            className="form-control"
            rows="4"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add private notes about this application..."
            style={{ borderRadius: '8px' }}
          ></textarea>
          <div className="d-flex justify-content-end mt-3">
            <button
              className="btn btn-primary btn-sm"
              onClick={saveAdminNotes}
              disabled={savingNotes}
              style={{ borderRadius: '6px' }}
            >
              {savingNotes ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
              ) : (
                <><i className="bi bi-save me-1"></i> Save Notes</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
            <h3 className="h5 mb-0">Uploaded Files</h3>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '30%' }} className="ps-4">Document Type</th>
                  <th style={{ width: '40%' }}>File Information</th>
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
                      <>
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i> Available
                        </span>
                        {fileInfo.transcript && (
                          <span className="ms-2 small text-muted">
                            {fileInfo.transcript.original_name}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="badge bg-secondary">Not uploaded</span>
                    )}
                  </td>
                  <td>
                    {application.transcript && (
                      <>
                        <button
                          onClick={() => handleFileDownload(application.transcript, 'transcript')}
                          className="btn btn-sm btn-outline-primary me-2"
                          disabled={fileLoading.transcript}
                        >
                          {fileLoading.transcript ? (
                            <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Loading...</>
                          ) : (
                            <><i className="bi bi-download me-1"></i> Download</>
                          )}
                        </button>
                        <button
                          onClick={() => handleFileView(application.transcript, 'transcript')}
                          className="btn btn-sm btn-outline-secondary"
                          disabled={fileLoading.transcript}
                        >
                          <i className="bi bi-eye me-1"></i> View
                        </button>
                      </>
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
                      <>
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i> Available
                        </span>
                        {fileInfo.cv && (
                          <span className="ms-2 small text-muted">
                            {fileInfo.cv.original_name}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="badge bg-secondary">Not uploaded</span>
                    )}
                  </td>
                  <td>
                    {application.cv && (
                      <>
                        <button
                          onClick={() => handleFileDownload(application.cv, 'cv')}
                          className="btn btn-sm btn-outline-primary me-2"
                          disabled={fileLoading.cv}
                        >
                          {fileLoading.cv ? (
                            <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Loading...</>
                          ) : (
                            <><i className="bi bi-download me-1"></i> Download</>
                          )}
                        </button>
                        <button
                          onClick={() => handleFileView(application.cv, 'cv')}
                          className="btn btn-sm btn-outline-secondary"
                          disabled={fileLoading.cv}
                        >
                          <i className="bi bi-eye me-1"></i> View
                        </button>
                      </>
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
                      <>
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i> Available
                        </span>
                        {fileInfo.photo && (
                          <span className="ms-2 small text-muted">
                            {fileInfo.photo.original_name}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="badge bg-secondary">Not uploaded</span>
                    )}
                  </td>
                  <td>
                    {application.photo && (
                      <>
                        <button
                          onClick={() => handleFileDownload(application.photo, 'photo')}
                          className="btn btn-sm btn-outline-primary me-2"
                          disabled={fileLoading.photo}
                        >
                          {fileLoading.photo ? (
                            <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Loading...</>
                          ) : (
                            <><i className="bi bi-download me-1"></i> Download</>
                          )}
                        </button>
                        <button
                          onClick={() => handleFileView(application.photo, 'photo')}
                          className="btn btn-sm btn-outline-secondary"
                          disabled={fileLoading.photo}
                        >
                          <i className="bi bi-eye me-1"></i> View
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View metadata */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle text-primary me-2"></i>
            <h3 className="h5 mb-0">View Information</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="small text-muted mb-1">Current User</div>
              <div className="fw-bold">{currentUser}</div>
            </div>
            <div className="col-md-4">
              <div className="small text-muted mb-1">View Date/Time (UTC)</div>
              <div className="fw-bold">{currentDateTime}</div>
            </div>
            <div className="col-md-4">
              <div className="small text-muted mb-1">Last Updated</div>
              <div className="fw-bold">{application.updated_at}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-sm"
          style={{
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            color: '#dc3545',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            padding: '0.5rem 1rem'
          }}
          onClick={openDeleteDialog}
        >
          <i className="bi bi-trash me-2"></i>
          Delete Application
        </button>

        <div>
          <button
            className="btn btn-sm me-2"
            style={{
              backgroundColor: 'rgba(25, 135, 84, 0.1)',
              color: '#198754',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              padding: '0.5rem 1rem'
            }}
            onClick={generateReport}
            disabled={application.generatingReport}
          >
            {application.generatingReport ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-text me-2"></i>
                Generate Report
              </>
            )}
          </button>

          <Link to={`/admin/edit-application/${id}`} className="btn btn-sm" style={{
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            color: '#0d6efd',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            padding: '0.5rem 1rem'
          }}>
            <i className="bi bi-pencil me-2"></i>
            Edit Application
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteDialog && (
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
                    You are about to delete the application for <strong>{application.first_name} {application.last_name}</strong>.
                    This action cannot be undone.
                  </p>
                </div>

                <div className="alert alert-warning p-2">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    All data associated with this application will be permanently removed from the system.
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
                  onClick={handleDeleteApplication}
                  disabled={application.deleting}
                >
                  {application.deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-1"></i> Delete Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* File Preview Modal */}
      {showPreviewModal && previewFile && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden', height: '80vh' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark text-primary me-2"></i>
                  {previewFile.fileName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPreviewModal(false)}></button>
              </div>
              <div className="modal-body p-0" style={{ height: 'calc(100% - 120px)', backgroundColor: '#f8f9fa' }}>
                <iframe
                  src={`/api/files/${previewFile.fileId}/view`}
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                  title="File Preview"
                ></iframe>
              </div>
              <div className="modal-footer" style={{ border: 'none' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPreviewModal(false)}>
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleFileDownload(previewFile.fileId, previewFile.fileType)}
                >
                  <i className="bi bi-download me-1"></i> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplication;