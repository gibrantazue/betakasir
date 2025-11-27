import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { geminiService, ChatMessage } from '../services/geminiService';
import { useSubscription } from '../hooks/useSubscription';
import { FeatureGate } from './FeatureGate';
import { aiContextService } from '../services/aiContextService';
import { quickActionsService } from '../services/quickActionsService';
import { QuickAction } from '../types/quickActions';
import { useAIActions } from '../hooks/useAIActions';
import { ActionConfirmDialog } from './ActionConfirmDialog';
import { AIAction } from '../types/actions';

interface AIAssistantProps {
  visible: boolean;
  onClose: () => void;
  currentScreen?: string; // NEW: Pass current screen
}

export default function AIAssistant({ visible, onClose, currentScreen = 'Home' }: AIAssistantProps) {
  const { hasFeature } = useSubscription();

  // Set context when screen changes
  useEffect(() => {
    aiContextService.setContext(currentScreen);
  }, [currentScreen]);

  // Get context-aware greeting
  const contextGreeting = aiContextService.getGreeting();
  const contextInsights = aiContextService.getProactiveInsights();

  // Initial message with context
  const getInitialMessage = (): string => {
    let message = contextGreeting;
    if (contextInsights.length > 0) {
      message += '\n\n' + contextInsights.join('\n');
    }
    return message;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: getInitialMessage(),
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // AI Actions integration
  const { detectIntent, isActionRequest, executeAction, getAction, isExecuting } = useAIActions();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: AIAction; parameters: Record<string, any> } | null>(null);

  // Get context-aware quick actions
  const quickActions = quickActionsService.getQuickActionsForScreen(currentScreen);
  
  // Advanced features state
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true);

  useEffect(() => {
    // Scroll to bottom when new message arrives
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    setInputText('');
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Check if message is an action request
      if (isActionRequest(messageText)) {
        const intent = detectIntent(messageText);
        console.log('🎯 Action detected:', intent);

        if (intent.action && intent.confidence > 0.7) {
          const action = getAction(intent.action);
          
          if (action) {
            // Show action detection message
            const detectionMessage: ChatMessage = {
              role: 'assistant',
              content: `🤖 Saya deteksi Anda ingin: **${action.name}**\n\nSedang memproses...`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, detectionMessage]);

            // If requires confirmation, show dialog
            if (action.requiresConfirmation) {
              setPendingAction({ action, parameters: intent.parameters });
              setShowConfirmDialog(true);
              setIsLoading(false);
              return;
            }

            // Execute action directly
            await handleExecuteAction(action, intent.parameters);
            setIsLoading(false);
            return;
          }
        }
      }

      // Normal AI response
      const response = await geminiService.sendMessage(messageText);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response || 'Maaf, tidak ada response dari AI.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Maaf, terjadi kesalahan saat menghubungi AI.\n\n${errorMsg.includes('API') ? 'Kemungkinan masalah:\n- Koneksi internet\n- API key tidak valid\n- Quota API habis' : 'Silakan coba lagi atau refresh halaman.'}\n\nCek console browser untuk detail error.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (action: AIAction, parameters: Record<string, any>) => {
    try {
      const result = await executeAction(action.id, parameters);

      const resultMessage: ChatMessage = {
        role: 'assistant',
        content: result.success 
          ? `✅ ${result.message}${result.data ? `\n\n📊 Detail:\n${JSON.stringify(result.data, null, 2)}` : ''}`
          : `❌ ${result.message}${result.error ? `\n\nError: ${result.error}` : ''}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, resultMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Gagal mengeksekusi action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);
    if (pendingAction) {
      setIsLoading(true);
      await handleExecuteAction(pendingAction.action, pendingAction.parameters);
      setPendingAction(null);
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
    
    const cancelMessage: ChatMessage = {
      role: 'assistant',
      content: '❌ Action dibatalkan. Ada yang bisa saya bantu lagi?',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleQuickAction = (query: string) => {
    handleSend(query);
  };

  const handleClearChat = () => {
    geminiService.clearHistory();
    setMessages([
      {
        role: 'assistant',
        content: '👋 Chat telah direset. Ada yang bisa saya bantu?',
        timestamp: new Date(),
      },
    ]);
  };

  // Check feature access
  if (!hasFeature('hasAIAssistant')) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.container}>
            <FeatureGate feature="hasAIAssistant" showUpgradePrompt={true}>
              <View />
            </FeatureGate>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonLocked}>
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiIcon}>
                <Ionicons name="sparkles" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>BetaKasir Assistant</Text>
                <Text style={styles.headerSubtitle}>✅ Sudah punya akses ke semua data bisnis kamu!</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleClearChat} style={styles.headerButton}>
                <Ionicons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {message.role === 'assistant' && (
                  <View style={styles.assistantIcon}>
                    <Ionicons name="sparkles" size={16} color="#DC143C" />
                  </View>
                )}
                {message.role === 'user' ? (
                  <Text style={[styles.messageText, styles.userText]}>
                    {message.content}
                  </Text>
                ) : (
                  <View style={styles.markdownContainer}>
                    <Markdown
                      style={{
                        body: styles.markdownBody,
                        heading2: styles.markdownH2,
                        heading3: styles.markdownH3,
                        strong: styles.markdownStrong,
                        em: styles.markdownEm,
                        bullet_list: styles.markdownList,
                        ordered_list: styles.markdownList,
                        list_item: styles.markdownListItem,
                        code_inline: styles.markdownCode,
                        fence: styles.markdownCodeBlock,
                        paragraph: styles.markdownParagraph,
                        link: styles.markdownLink,
                      }}
                      onLinkPress={(url) => {
                        // Open WhatsApp link
                        if (Platform.OS === 'web') {
                          window.open(url, '_blank');
                        } else {
                          // For mobile, use Linking
                          import('react-native').then(({ Linking }) => {
                            Linking.openURL(url);
                          });
                        }
                        return false;
                      }}
                    >
                      {message.content}
                    </Markdown>
                  </View>
                )}
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color="#DC143C" />
                <Text style={styles.loadingText}>Mengetik...</Text>
              </View>
            )}
          </ScrollView>

          {/* Advanced Features - Gemini Style */}
          {messages.length <= 1 && showAdvancedFeatures && (
            <View style={styles.advancedFeaturesContainer}>
              <View style={styles.advancedFeaturesHeader}>
                <Text style={styles.advancedFeaturesTitle}>✨ Fitur Advanced</Text>
                <TouchableOpacity 
                  onPress={() => setShowAdvancedFeatures(false)}
                  style={styles.toggleButton}
                >
                  <Text style={styles.toggleButtonText}>Quick Actions →</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.advancedFeaturesScroll}
              >
                {/* Diagram & Infografis */}
                <TouchableOpacity
                  style={styles.advancedFeatureCard}
                  onPress={() => handleSend('Buatkan diagram untuk bisnis saya')}
                >
                  <View style={styles.featureIconContainer}>
                    <Text style={styles.featureIcon}>📊</Text>
                  </View>
                  <Text style={styles.featureTitle}>Diagram & Infografis</Text>
                  <Text style={styles.featureDescription}>
                    Flowchart, mindmap, timeline, charts
                  </Text>
                </TouchableOpacity>

                {/* Kuis Interaktif */}
                <TouchableOpacity
                  style={styles.advancedFeatureCard}
                  onPress={() => handleSend('Buatkan kuis untuk saya')}
                >
                  <View style={styles.featureIconContainer}>
                    <Text style={styles.featureIcon}>🎯</Text>
                  </View>
                  <Text style={styles.featureTitle}>Kuis Interaktif</Text>
                  <Text style={styles.featureDescription}>
                    Quiz dengan scoring & feedback
                  </Text>
                </TouchableOpacity>

                {/* Deep Research */}
                <TouchableOpacity
                  style={styles.advancedFeatureCard}
                  onPress={() => handleSend('Lakukan deep research tentang bisnis saya')}
                >
                  <View style={styles.featureIconContainer}>
                    <Text style={styles.featureIcon}>🔍</Text>
                  </View>
                  <Text style={styles.featureTitle}>Deep Research</Text>
                  <Text style={styles.featureDescription}>
                    Analisis mendalam 4 fase
                  </Text>
                </TouchableOpacity>

                {/* Canvas */}
                <TouchableOpacity
                  style={styles.advancedFeatureCard}
                  onPress={() => handleSend('Buatkan canvas untuk brainstorming')}
                >
                  <View style={styles.featureIconContainer}>
                    <Text style={styles.featureIcon}>🎨</Text>
                  </View>
                  <Text style={styles.featureTitle}>Canvas</Text>
                  <Text style={styles.featureDescription}>
                    Workspace kolaboratif
                  </Text>
                </TouchableOpacity>

                {/* Pembelajaran */}
                <TouchableOpacity
                  style={styles.advancedFeatureCard}
                  onPress={() => handleSend('Aku mau belajar')}
                >
                  <View style={styles.featureIconContainer}>
                    <Text style={styles.featureIcon}>📚</Text>
                  </View>
                  <Text style={styles.featureTitle}>Pembelajaran</Text>
                  <Text style={styles.featureDescription}>
                    Learning modules & tutorial
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Quick Actions */}
          {messages.length <= 1 && !showAdvancedFeatures && (
            <View style={styles.quickActionsContainer}>
              <View style={styles.advancedFeaturesHeader}>
                <Text style={styles.advancedFeaturesTitle}>⚡ Quick Actions</Text>
                <TouchableOpacity 
                  onPress={() => setShowAdvancedFeatures(true)}
                  style={styles.toggleButton}
                >
                  <Text style={styles.toggleButtonText}>← Advanced</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.quickActionsContent}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionButton}
                    onPress={() => handleQuickAction(action.prompt)}
                  >
                    <Text style={styles.quickActionIcon}>{action.icon}</Text>
                    <Text style={styles.quickActionText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => {
                  // Show info about Image Recognition
                  const message: ChatMessage = {
                    role: 'assistant',
                    content: '📸 **Image Recognition**\n\nUntuk menggunakan fitur Image Recognition:\n\n1. **Products Screen** → Klik tombol QR hijau 🔍\n2. **Transactions Screen** → Klik tombol "Scan" 📄\n\nFitur ini memungkinkan Anda:\n- Scan produk dari foto\n- Import data dari struk belanja\n- Analisis gambar dengan AI',
                    timestamp: new Date(),
                  };
                  setMessages(prev => [...prev, message]);
                }}
              >
                <Ionicons name="images-outline" size={22} color="#DC143C" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Tanya sesuatu..."
                placeholderTextColor="#666"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                onKeyPress={(e) => {
                  // Enter to send on web
                  if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>

      {/* Action Confirmation Dialog */}
      <ActionConfirmDialog
        visible={showConfirmDialog}
        action={pendingAction?.action || null}
        parameters={pendingAction?.parameters || {}}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    borderTopWidth: 3,
    borderTopColor: '#DC143C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButtonLocked: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#DC143C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  headerButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    flexShrink: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DC143C',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  assistantIcon: {
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    flexShrink: 1,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#fff',
  },
  // Markdown container - FIX OVERFLOW
  markdownContainer: {
    flex: 1,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  // Markdown styles
  markdownBody: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  markdownH2: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  markdownH3: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  markdownStrong: {
    color: '#fff',
    fontWeight: '700',
    flexShrink: 1,
  },
  markdownEm: {
    color: '#e0e0e0',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  markdownList: {
    marginTop: 4,
    marginBottom: 4,
    flexShrink: 1,
  },
  markdownListItem: {
    color: '#fff',
    marginBottom: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  markdownCode: {
    backgroundColor: '#2a2a2a',
    color: '#DC143C',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  markdownCodeBlock: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  markdownParagraph: {
    marginTop: 0,
    marginBottom: 8,
    color: '#fff',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  markdownLink: {
    color: '#DC143C',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginLeft: 8,
  },
  // Advanced Features Styles
  advancedFeaturesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#0a0a0a',
    paddingVertical: 16,
  },
  advancedFeaturesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  advancedFeaturesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  toggleButtonText: {
    color: '#DC143C',
    fontSize: 12,
    fontWeight: '600',
  },
  advancedFeaturesScroll: {
    paddingHorizontal: 12,
  },
  advancedFeatureCard: {
    width: 160,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  featureDescription: {
    color: '#999',
    fontSize: 12,
    lineHeight: 16,
  },
  quickActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#0a0a0a',
  },
  quickActionsContent: {
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  quickActionButton: {
    width: 90,
    height: 90,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC143C',
    marginRight: 8,
    marginBottom: 8,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 8,
    alignItems: 'flex-end',
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
