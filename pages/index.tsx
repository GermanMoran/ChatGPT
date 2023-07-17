import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
// Nuevas librerias y dependencias PDF-VIWER
import ReactDOM from 'react-dom';
import {Worker, Viewer } from '@react-pdf-viewer/core';
import * as pdfjs from "pdfjs-dist";
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { ClearChatButton } from "../components/ClearChatButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  //const [error, setError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hola, Que le gustaría aprender acerca de sus documentos?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });
  
  // Nuevas Constantes 
  const [shown, setShown] = useState(false);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  //
  const { messages, history } = messageState;
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
        }),
      });
      const data = await response.json();
      console.log('data', data);

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.text]],
        }));
      }
      console.log('messageState', messageState);
      console.log("History: ",history)
      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  
  const limpiarChat = () => {
    //question = "";
    //error && setError(undefined);
    //setActiveCitation(undefined);
    //setActiveAnalysisPanelTab(undefined);
    setMessageState({
      messages: [
        {
          message: 'Hola, Que le gustaría aprender acerca de sus documentos?',
          type: 'apiMessage',
        },
      ],
      history: [],
    });
    console.log("Hola Mundo");
 };
  




  const modalBody = (reference: any) => (
    <div
        style={{
            backgroundColor: '#fff',
            flexDirection: 'column',
            overflow: 'hidden',

            /* Fixed position */
            left: 0,
            position: 'fixed',
            top: 0,

            /* Take full size */
            height: '100%',
            width: '100%',

            /* Displayed on top of other elements */
            zIndex: 9999,
        }}
    >
        <div
            style={{
                alignItems: 'center',
                backgroundColor: '#000',
                color: '#fff',
                display: 'flex',
                padding: '.5rem',
            }}
        >
            <div style={{ marginRight: 'auto' }}>{reference}</div>
            <button
                style={{
                    backgroundColor: '#357edd',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '8px',
                }}
                onClick={() => setShown(false)}
            >
                cerrar
            </button>
        </div>
        <div
            style={{
                flexGrow: 1,
                overflow: 'auto',
            }}
        >
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js">
        <div
            style={{
                height: '750px',
                width: '900px',
                marginLeft: 'auto',
                marginRight: 'auto',
            }}
        >
            <Viewer fileUrl= {reference}  plugins={[defaultLayoutPluginInstance]} />
        </div>
    </Worker>
        </div>
    </div>
  );


  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <>
      <Layout>
      <ClearChatButton className={styles.commandButton} onClick={limpiarChat}/>
        <div className="mx-auto flex flex-col gap-4">
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
            Chat con tus Datos
          </h1>
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src="/bot-image.png"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/usericon.png"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <>
                    
                      <div key={`chatMessage-${index}`} className={className} id='micapa'>
                        {icon}
                        <div className={styles.markdownanswer}>
                          <ReactMarkdown linkTarget="_blank">
                            {message.message}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc, index) => (
                              <div key={`messageSourceDocs-${index}`}>
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Source {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <p className="mt-2">
                                      <b>Source:</b> {doc.metadata.source}
                                      
                                      <button
                                          style={{
                                              backgroundColor: '#00449e',
                                              border: 'none',
                                              borderRadius: '.25rem',
                                              color: '#fff',
                                              cursor: 'pointer',
                                              padding: '.5rem',
                                          }}
                                          onClick={() => setShown(true)}
                                      >
                                          Source
                                      </button>
                                      {shown && ReactDOM.createPortal(modalBody(`${doc.metadata.source}`.split('\\')[7]), document.body)}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit}>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={1}
                    maxLength={512}
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Esperando por una respuesta'
                        : 'Haz una pregunta '
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.generatebutton}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
          <button id="eliminar">Eliminar Chat</button>
        </div>
      </Layout> 
    </>
  );
}
