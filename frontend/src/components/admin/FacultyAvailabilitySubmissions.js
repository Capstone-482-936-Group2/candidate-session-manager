import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { facultyAvailabilityAPI, candidateSectionsAPI } from '../../api/api';

/**
 * Component for displaying faculty availability submissions for selected candidates.
 * Allows admins to view which faculty members have submitted their availability
 * for meeting with a particular candidate during their visit.
 */
const FacultyAvailabilitySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidateSections, setCandidateSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');

  /**
   * Fetch all candidate sections on component mount
   */
  useEffect(() => {
    fetchCandidateSections();
  }, []);

  /**
   * Fetch faculty submissions whenever the selected section changes
   */
  useEffect(() => {
    if (selectedSection) {
      fetchSubmissions(selectedSection);
    }
  }, [selectedSection]);

  /**
   * Fetches all candidate sections from the API
   */
  const fetchCandidateSections = async () => {
    try {
      const response = await candidateSectionsAPI.getCandidateSections();
      setCandidateSections(response.data);
    } catch (err) {
      setError('Failed to load candidate sections');
    }
  };

  /**
   * Fetches faculty availability submissions for a specific candidate section
   * @param {number} sectionId - The ID of the candidate section to fetch submissions for
   */
  const fetchSubmissions = async (sectionId) => {
    setLoading(true);
    try {
      const response = await facultyAvailabilityAPI.getAvailabilityByCandidate(sectionId);
      setSubmissions(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load faculty availability submissions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formats a date-time string to a localized string for display
   * @param {string} dateTimeStr - ISO date-time string to format
   * @returns {string} Formatted date-time string
   */
  const formatDateTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Candidate</InputLabel>
        <Select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          label="Select Candidate"
        >
          {candidateSections.map((section) => (
            <MenuItem key={section.id} value={section.id}>
              {section.candidate.email} - {section.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : selectedSection ? (
        submissions.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center">
            No faculty availability submissions for this candidate
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Faculty Member</TableCell>
                  <TableCell>Submitted At</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Time Slots</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {submission.faculty_name}
                      <Typography variant="caption" display="block">
                        {submission.faculty_email}
                      </Typography>
                      {submission.faculty_room && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Room: {submission.faculty_room}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(submission.submitted_at)}</TableCell>
                    <TableCell>{formatDateTime(submission.updated_at)}</TableCell>
                    <TableCell>
                      {(submission.time_slots || []).map((slot, index) => (
                        <Chip
                          key={index}
                          label={`${formatDateTime(slot.start_time)} - ${formatDateTime(slot.end_time)}`}
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{submission.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        <Typography variant="body1" color="text.secondary" align="center">
          Please select a candidate to view faculty availability submissions
        </Typography>
      )}

      {submissions.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No faculty availability submissions available for import.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Either no faculty have submitted their availability yet, or all submissions have already been imported.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FacultyAvailabilitySubmissions;
