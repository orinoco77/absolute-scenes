import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from 'react-native';
import GitHubService from '../shared/services/GitHubService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentScene, setCurrentScene] = useState(null);
  const [sceneText, setSceneText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = GitHubService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      loadRepositories();
    }
  };

  const handleLogin = async () => {
    if (!token) {
      Alert.alert('Error', 'Please enter your GitHub token');
      return;
    }

    setLoading(true);
    try {
      await GitHubService.validateAndSetupToken(token);
      setIsAuthenticated(true);
      setToken('');
      Alert.alert('Success', 'Connected to GitHub!');
      loadRepositories();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRepositories = async () => {
    setLoading(true);
    try {
      const repos = await GitHubService.getUserRepositoriesForRecovery();
      setRepositories(repos);
    } catch (error) {
      Alert.alert('Error', 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const loadBook = async (repo) => {
    setLoading(true);
    try {
      const bookData = await GitHubService.downloadBookFromRepository(
        repo.full_name,
        repo.bookFile.name
      );
      setSelectedBook(bookData);
      
      // Load first scene if available
      if (bookData.bookData.scenes && bookData.bookData.scenes.length > 0) {
        const firstScene = bookData.bookData.scenes[0];
        setCurrentScene(firstScene);
        setSceneText(firstScene.content || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const saveScene = async () => {
    if (!selectedBook || !currentScene) return;

    setLoading(true);
    try {
      // Update the scene content
      const updatedBookData = { ...selectedBook.bookData };
      const sceneIndex = updatedBookData.scenes.findIndex(
        s => s.id === currentScene.id
      );
      
      if (sceneIndex !== -1) {
        updatedBookData.scenes[sceneIndex].content = sceneText;
        updatedBookData.scenes[sceneIndex].lastModified = new Date().toISOString();
      }

      await GitHubService.saveBookToRepository(
        selectedBook.repository,
        updatedBookData,
        `Mobile edit: Updated scene "${currentScene.title}"`
      );

      Alert.alert('Success', 'Scene saved to GitHub!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save scene');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await GitHubService.disconnect();
    setIsAuthenticated(false);
    setRepositories([]);
    setSelectedBook(null);
    setCurrentScene(null);
    setSceneText('');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.title}>AbsoluteScenes Mobile</Text>
          <Text style={styles.subtitle}>Connect to GitHub</Text>
          
          <TextInput
            style={styles.input}
            placeholder="GitHub Personal Access Token"
            value={token}
            onChangeText={setToken}
            secureTextEntry
            autoCapitalize="none"
          />
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Connecting...' : 'Connect'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.helpText}>
            Create a token at github.com/settings/tokens{'\n'}
            with 'repo' and 'user:email' permissions
          </Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  if (!selectedBook) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Books</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.repoList}>
          {repositories.map((repo) => (
            <TouchableOpacity
              key={repo.id}
              style={styles.repoItem}
              onPress={() => loadBook(repo)}
            >
              <Text style={styles.repoName}>{repo.name}</Text>
              <Text style={styles.repoDescription}>
                {repo.description || 'No description'}
              </Text>
              <Text style={styles.repoFile}>📖 {repo.bookFile.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedBook(null)}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.sceneTitle}>
          {currentScene?.title || 'Scene'}
        </Text>
        <TouchableOpacity onPress={saveScene} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.editorContainer}>
        <TextInput
          style={styles.sceneEditor}
          value={sceneText}
          onChangeText={setSceneText}
          multiline
          placeholder="Start writing your scene..."
          textAlignVertical="top"
        />
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
  sceneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveDisabled: {
    opacity: 0.6,
  },
  repoList: {
    flex: 1,
    padding: 15,
  },
  repoItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  repoName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  repoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  repoFile: {
    fontSize: 12,
    color: '#007AFF',
  },
  editorContainer: {
    flex: 1,
    padding: 15,
  },
  sceneEditor: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 500,
  },
});
