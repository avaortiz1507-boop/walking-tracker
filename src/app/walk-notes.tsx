import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function WalkNotesScreen(){

    // different states for managing walk notes, input, and status messages
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [status, setStatus] = useState("No actions yet.");

  // function to save a note to the list of notes
  const saveNote = () => {
    // if note is empty, it asks to enter a note
    if (note.trim() === "") {
      setStatus("Please enter a note.");
      return;
    }

    // add the new note to the list of notes
    setNotes([...notes, note]);
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

      <TextInput
        style={styles.input}
        placeholder=""
        value={note}
        onChangeText={setNote}
      />

      <Button title="Save Note" onPress={saveNote} />
      <Button title="Sync Now" onPress={syncNow} />

      <Text style={styles.status}>
        Status: {status}
      </Text>
    </View>

    <View style={styles.rightPanel}>
       <Text style={styles.heading}>Walk Notes</Text>


      <FlatList
        data={notes}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.noteItem}>{item}</Text>
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
  },
  status: {
    marginTop: 15,
  },
  noteItem: {
    paddingVertical: 5,
  },
});