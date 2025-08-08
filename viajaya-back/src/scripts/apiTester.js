const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Colores para la consola
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

class APITester {
    constructor() {
        this.token = null;
        this.baseURL = BASE_URL;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testLogin() {
        log.info('Testing login...');
        try {
            const response = await axios.post(`${this.baseURL}/user/login`, {
                email: 'admin@viajaya.com',
                password: 'Admin123!'
            });

            if (response.data.success && response.data.token) {
                this.token = response.data.token;
                log.success('Login successful');
                log.info(`Token: ${this.token.substring(0, 20)}...`);
                return true;
            } else {
                log.error('Login failed - no token received');
                return false;
            }
        } catch (error) {
            log.error(`Login failed: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    async testVerifyToken() {
        if (!this.token) {
            log.error('No token available for verification');
            return false;
        }

        log.info('Testing token verification...');
        try {
            const response = await axios.get(`${this.baseURL}/user/verify/token`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.data.valid) {
                log.success('Token verification successful');
                log.info(`User: ${response.data.user.name} ${response.data.user.lastname}`);
                return true;
            } else {
                log.error('Token verification failed');
                return false;
            }
        } catch (error) {
            log.error(`Token verification failed: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    async testGetProfile() {
        if (!this.token) {
            log.error('No token available for profile test');
            return false;
        }

        log.info('Testing get profile...');
        try {
            const response = await axios.get(`${this.baseURL}/user/profile`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.data.success) {
                log.success('Get profile successful');
                log.info(`Role: ${response.data.user.role} (${this.getRoleName(response.data.user.role)})`);
                return true;
            } else {
                log.error('Get profile failed');
                return false;
            }
        } catch (error) {
            log.error(`Get profile failed: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    async testCreateQuote() {
        if (!this.token) {
            log.error('No token available for quote creation');
            return false;
        }

        log.info('Testing quote creation...');
        try {
            const quoteData = {
                asesor_id: 1,
                lider_id: 1,
                gerente_id: 1,
                cliente_id: 1,
                numero_personas: 2,
                fecha_ida: '2024-12-15',
                fecha_regreso: '2024-12-22',
                destino: 'Cartagena',
                origen: 'Bogotá',
                acomodacion: 'Doble',
                tipo_hotel: '4 estrellas',
                ninos: 0,
                edades_ninos: [],
                observaciones: 'Prueba de cotización desde script de testing'
            };

            const response = await axios.post(`${this.baseURL}/quotes`, quoteData, {
                headers: { 
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.message === 'Cotización creada exitosamente') {
                log.success('Quote creation successful');
                log.info(`Quote number: ${response.data.quote.quote_number}`);
                return response.data.quote.id;
            } else {
                log.error('Quote creation failed');
                return false;
            }
        } catch (error) {
            log.error(`Quote creation failed: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    async testGetQuotes() {
        if (!this.token) {
            log.error('No token available for quotes list');
            return false;
        }

        log.info('Testing get quotes...');
        try {
            const response = await axios.get(`${this.baseURL}/quotes`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.data.quotes) {
                log.success(`Get quotes successful - Found ${response.data.quotes.length} quotes`);
                return true;
            } else {
                log.error('Get quotes failed');
                return false;
            }
        } catch (error) {
            log.error(`Get quotes failed: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    async testUnauthorizedAccess() {
        log.info('Testing unauthorized access...');
        try {
            await axios.get(`${this.baseURL}/quotes`);
            log.error('Unauthorized access should have failed but succeeded');
            return false;
        } catch (error) {
            if (error.response?.status === 401) {
                log.success('Unauthorized access properly blocked');
                return true;
            } else {
                log.error(`Unexpected error: ${error.message}`);
                return false;
            }
        }
    }

    getRoleName(roleNumber) {
        const roles = {
            1: 'Cliente',
            2: 'Asesor',
            3: 'Líder',
            4: 'Gerente',
            5: 'Admin',
            6: 'Contador',
            7: 'Owner'
        };
        return roles[roleNumber] || 'Desconocido';
    }

    async runAllTests() {
        console.log('🚀 Starting API Tests for ViajaYa\n');

        const tests = [
            { name: 'Login', fn: () => this.testLogin() },
            { name: 'Verify Token', fn: () => this.testVerifyToken() },
            { name: 'Get Profile', fn: () => this.testGetProfile() },
            { name: 'Unauthorized Access', fn: () => this.testUnauthorizedAccess() },
            { name: 'Create Quote', fn: () => this.testCreateQuote() },
            { name: 'Get Quotes', fn: () => this.testGetQuotes() }
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            console.log(`\n--- ${test.name} ---`);
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
            await this.sleep(500); // Pequeña pausa entre tests
        }

        console.log('\n📊 Test Results:');
        console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
        console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
        console.log(`${colors.blue}📋 Total: ${passed + failed}${colors.reset}`);

        if (failed === 0) {
            log.success('🎉 All tests passed! API is working correctly.');
        } else {
            log.warning(`⚠️  ${failed} test(s) failed. Check the logs above.`);
        }
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new APITester();
    tester.runAllTests().catch(console.error);
}

module.exports = APITester;
