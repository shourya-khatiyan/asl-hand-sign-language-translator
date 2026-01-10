import React from 'react'
import {Helmet} from 'react-helmet'

export default function Metatags() {
    return (
        <div>
            <Helmet htmlAttributes={{
    lang: 'en',
  }}>
          <meta charSet="utf-8" name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
          <title>ASL Translator | Real-time Sign Language Detection</title>
          <meta name="description" content='Real-time ASL (American Sign Language) alphabet translator using TensorFlow and Handpose AI model.'/>
                
                {/* OpenGraph tags */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="ASL Translator | Real-time Sign Language Detection" />
                <meta property="og:description" content='Real-time ASL (American Sign Language) alphabet translator using TensorFlow and Handpose AI model.'/>
                
                {/* Twitter Card tags */}
                <meta name="twitter:card" content="summary"/>
                <meta name="twitter:title" content="ASL Translator | Real-time Sign Language Detection"/>
                <meta name="twitter:description" content='Real-time ASL (American Sign Language) alphabet translator using TensorFlow and Handpose AI model.'/>
        </Helmet>
        </div>
    )
}
