const fs = require('fs');
const file = 'index.js';
let code = fs.readFileSync(file, 'utf8');

const s1 = code.indexOf('{/* Sub-split: Tickets Stats & Goals */}');
const e1 = code.indexOf('</div>\n\n                                {/* ── Right Column ── */}');
const chunk1 = code.substring(s1, e1);

const s2 = code.indexOf('{/* Call Performance Card */}');
const e2 = code.indexOf('</div>\n                                </div>\n                            </div>\n                        </div>\n                    </>}');
const chunk2 = code.substring(s2, e2);

// Remove chunks from original code
let newCode = code.replace(chunk1, '');
newCode = newCode.replace(chunk2, '');

const injection = `
                            </div>
                            
                            {/* ── Bottom Bento Row ── */}
                            <div className="cd-bento-bottom">
                                ${chunk1.replace('<div className="cd-bento-split">', '<div className="cd-bento-contents" style={{ display: \'contents\' }}>')}
                                ${chunk2.replace('<div className="cd-bento-split" style={{ flex: 1 }}>', '<div className="cd-bento-stack">')}
                            </div>
`;

newCode = newCode.replace('</div>\n                                </div>\n                            </div>\n                        </div>\n                    </>}', '</div>\n                                </div>\n                            </div>\n' + injection + '\n                        </div>\n                    </>}');

fs.writeFileSync('index.js', newCode);
console.log('Successfully re-arranged components');
