import React from 'react';

export function EditorMockStrip() {
  return (
    <div className="marketing-editor-strip">
      <div className="marketing-container">
        <div className="marketing-editor-mock" aria-hidden>
          <div className="marketing-editor-bar">
            <span className="marketing-dot marketing-dot-r" />
            <span className="marketing-dot marketing-dot-y" />
            <span className="marketing-dot marketing-dot-g" />
            <div className="marketing-mock-tabs">
              <span className="marketing-mock-tab on">index.html</span>
              <span className="marketing-mock-tab">style.css</span>
              <span className="marketing-mock-tab">script.js</span>
            </div>
            <div className="marketing-mock-btns">
              <span className="marketing-mbtn marketing-mbtn-o">⚡ Starters</span>
              <span className="marketing-mbtn marketing-mbtn-g">Live Preview</span>
              <span className="marketing-mbtn marketing-mbtn-p">Share</span>
            </div>
          </div>
          <div className="marketing-mock-body">
            <div className="marketing-mock-side">
              <div className="marketing-side-label">Templates</div>
              <div className="marketing-side-item on">📄 Basic HTML</div>
              <div className="marketing-side-item">📄 A-Frame Scene</div>
              <div className="marketing-side-item">📄 Babylon Starter</div>
              <div className="marketing-side-split">
                <div className="marketing-side-label">Files</div>
                <div className="marketing-side-item">🖼 image.jpg</div>
                <div className="marketing-side-item">📦 model.glb</div>
              </div>
            </div>
            <div className="marketing-mock-code">
              <div className="marketing-cl">
                <span className="marketing-ln">1</span>
                <span className="marketing-tg">&lt;!doctype</span> <span className="marketing-at">html</span>
                <span className="marketing-tg">&gt;</span>
              </div>
              <div className="marketing-cl">
                <span className="marketing-ln">2</span>
                <span className="marketing-tg">&lt;html</span> <span className="marketing-at">lang</span>
                <span className="marketing-tx">=</span>
                <span className="marketing-st">\"en\"</span>
                <span className="marketing-tg">&gt;</span>
              </div>
              <div className="marketing-cl">
                <span className="marketing-ln">3</span>
                <span className="marketing-tg">&lt;body&gt;</span>
              </div>
              <div className="marketing-cl">
                <span className="marketing-ln">4</span>
                <span className="marketing-tg">&lt;a-scene&gt;</span>
              </div>
              <div className="marketing-cl">
                <span className="marketing-ln">5</span>
                <span className="marketing-tg">&lt;a-box</span> <span className="marketing-at">color</span>
                <span className="marketing-tx">=</span>
                <span className="marketing-st">\"#4ade80\"</span>
                <span className="marketing-tg">&gt;</span>
                <span className="marketing-tg">&lt;/a-box&gt;</span>
              </div>
              <div className="marketing-cl">
                <span className="marketing-ln">6</span>
                <span className="marketing-tg">&lt;/a-scene&gt;</span>
              </div>
              <div className="marketing-cl">
                <span className="marketing-ln">7</span>
                <span className="marketing-tg">&lt;/body&gt;</span>
              </div>
              <div className="marketing-cl">
                <span className="marketing-ln">8</span>
                <span className="marketing-tg">&lt;/html&gt;</span>
              </div>
            </div>
            <div className="marketing-mock-prev">
              <div className="marketing-prev-h">Live Preview</div>
              <div className="marketing-prev-p">
                Edit code on the left. Preview updates instantly — no installs required.
              </div>
              <div className="marketing-prev-img">🕶️</div>
              <div className="marketing-prev-foot">Preview — Medium</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

