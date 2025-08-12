// views/ChatView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Helper function to format message timestamps (HH:MM)
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatView({
  messages,               // Array of chat messages
  loading,                // Boolean indicating loading state
  input,                  // Current message input value
  setInput,               // Function to update message input
  sendMessage,            // Function to send a message
  handleDeleteMessage,    // Function to delete a message
  navigation,             // Navigation prop for screen transitions
  friendName,             // Name of the chat recipient
  flatListRef,            // Ref for FlatList (used for auto-scrolling)
  userId,                 // Current logged-in user's ID
}) {
  return (
    <SafeAreaView style={styles.container}>
      
      {/* ====== HEADER ====== */}
      <View style={styles.headerContainer}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Title with friend's name */}
        <Text style={styles.headerText}>Chat with {friendName}</Text>

        {/* Spacer to center the title */}
        <View style={styles.headerSpacer} />
      </View>

      {/* ====== MESSAGES LIST ====== */}
      {loading ? (
        // Loading indicator when messages are being fetched
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              // Long press to delete (only for sender's own messages)
              onLongPress={() => {
                if (item.sender_id === userId) {
                  Alert.alert('Delete Message', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(item.id) },
                  ]);
                }
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.sender_id === userId ? styles.myMessage : styles.theirMessage,
                ]}
              >
                {/* Message content */}
                <Text style={styles.messageText}>{item.content}</Text>

                {/* Message timestamp */}
                <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
              </View>
            </TouchableOpacity>
          )}
          // Auto-scroll to bottom when content changes or layout updates
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* ====== MESSAGE INPUT BAR ====== */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          {/* Text input for new message */}
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#aaa"
            style={styles.input}
            value={input}
            onChangeText={setInput}
          />
          {/* Send button */}
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B182B',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 5,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 28,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
  },
  messageBubble: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 10,
    maxWidth: '75%',
  },
  myMessage: {
    backgroundColor: '#6C63FF',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A273E',
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
    marginBottom: Platform.OS === 'ios' ? 10 : 5,
  },
  input: {
    flex: 1,
    color: '#fff',
  },
  sendBtn: {
    marginLeft: 10,
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
