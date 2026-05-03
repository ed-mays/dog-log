import { useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { useIncidentStore } from '@store/useIncidentStore';

function formatElapsedTime(elapsedSeconds: number): string {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function IncidentJournal() {
  const { activeIncident, appendJournal } = useIncidentStore();
  const [inputText, setInputText] = useState('');

  const handleKeyDown = async (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Extract first line (up to first newline, if any)
      const firstLine = inputText.split('\n')[0] || '';
      const trimmed = firstLine.trim();

      if (trimmed) {
        await appendJournal(trimmed);
        setInputText('');
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  return (
    <Box>
      {activeIncident && activeIncident.journal.length > 0 && (
        <Box mb={2}>
          {activeIncident.journal.map((entry, index) => (
            <Box key={index} mb={1}>
              <Typography variant="body2" component="span" fontWeight="bold">
                {formatElapsedTime(entry.elapsedSeconds)}
              </Typography>
              <Typography variant="body2" component="span" ml={1}>
                {entry.text}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <TextField
        multiline
        fullWidth
        minRows={3}
        maxRows={8}
        value={inputText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        label="Journal"
        placeholder="Press Enter to commit entry..."
        aria-label="Journal"
      />
    </Box>
  );
}
