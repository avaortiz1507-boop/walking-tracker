import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';

type Note = {
  id: string;
  text: string;
  createdAt: string;
  syncStatus: string;
};

export default function WalkNotesScreen() {
 // different states for managing walk notes, input, and status messages
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState("No actions yet.");

  const MAX_LENGTH = 200;
  // function to check if note exceeds max length
  const isNoteTooLong = (note: string) => note.length > MAX_LENGTH;

  // function to save a note to the list of notes
  const saveNote = () => {

    // function to remove the extra spaces from the note before processing it
 const trimmedNote = note.trim();

    // Check for empty note
    if (trimmedNote === "") {
      setStatus("Please enter a note before saving.");
      return;
    }

    // Check for max length
    if (isNoteTooLong(trimmedNote)) {
      setStatus(`Note cannot exceed ${MAX_LENGTH} characters.`);
      return;
    }

    // Creates a new note object
    const newNote: Note = {
      id: Date.now().toString(),
      text: trimmedNote,
      createdAt: new Date().toLocaleString(),
      syncStatus: "pending",
    };

    // Add note to list
    setNotes([...notes, newNote]);

    setStatus("Note saved successfully!");
    setNote("");
  };

  // syncing notes
  const syncNow = () => {
    setStatus("Sync completed.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftPanel}>
        <Text style={styles.heading}>Walk Notes</Text>

        <Text style={styles.counter}>
          {note.length} / {MAX_LENGTH} characters
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter a note about your walk"
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={MAX_LENGTH} // Enforces limit at input level
        />

        <Button title="Save Note" onPress={saveNote} />

        <View style={{ marginTop: 10 }}>
          <Button title="Sync Now" onPress={syncNow} />
        </View>

        <Text style={styles.status}>
          Status: {status}
        </Text>
      </View>

      <View style={styles.rightPanel}>
        <Text style={styles.heading}>Walk Notes</Text>

        <FlatList
          data={notes}
          // item represents each note in the list
          keyExtractor={(item) => item.id}
          renderItem={({ item: note }) => (
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                {note.text}
              </Text>

              <Text style={styles.noteMeta}>
                Created: {note.createdAt}
              </Text>

              <Text style={styles.noteMeta}>
                Status: {note.syncStatus}
              </Text>

              <Text style={styles.noteMeta}>
                ID: {note.id}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
  // FlatList is to display the list of items(notes)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    padding: 20,
  },
  leftPanel: {
    flex: 1,
    marginRight: 20,
  },
  rightPanel: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: "#ccc",
    paddingLeft: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  status: {
    marginTop: 15,
  },
  counter: {
    marginBottom: 8,
    fontSize: 14,
    color: "#555",
  },
  noteCard: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  noteText: {
    fontSize: 16,
    marginBottom: 5,
  },
  noteMeta: {
    fontSize: 12,
    color: "gray",
  },
});