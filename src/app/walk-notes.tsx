import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';

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
  // Loading previously saved notes from AsyncStorage 
  useEffect(() => {loadNotes();}, []);

  const MAX_LENGTH = 200;
  // function to check if note exceeds max length
  const isNoteTooLong = (note: string) => note.length > MAX_LENGTH;

  // function to save a note to the list of notes
  const saveNote = async () => {

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


    // add the new note to the list of notes
    const updatedNotes = [...notes, newNote];
    try {
      // Update state so the note appears immediately
      setNotes(updatedNotes);

    // Save notes to AsyncStorage
    await AsyncStorage.setItem(
      "walkNotes",
      // converts the updated notes array to a JSON string for storage
      JSON.stringify(updatedNotes)
    );

    // Clear the input field after saving the note
    setNote("");

    setStatus("Note saved on this device.");
  } catch (error) {
    setStatus("Cannot save note.");
    console.error(error);
  }
  };


  // loading notes from AsyncStorage
  const loadNotes = async () => {
  try {
    const storedNotes = await AsyncStorage.getItem("walkNotes");
    // if the notes are found, convert them from JSON and set the state
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  } catch (error) {
    console.error(error);
  }
};
  // syncing notes
  const syncNow = () => {
    setStatus("Sync completed.");
  };

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.inputSection}>
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
      }
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
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No notes yet. Add your first note above!</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 20,
  },
  inputSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    textAlign: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  counter: {
    marginBottom: 12,
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  noteCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  noteText: {
    fontSize: 15,
    marginBottom: 8,
    color: "#333",
    lineHeight: 22,
  },
  noteMeta: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});